const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4000';

function ok(label) {
  console.log(`  ok  ${label}`);
}

function check(condition, label) {
  if (!condition) {
    throw new Error(`Check failed: ${label}`);
  }

  ok(label);
}

async function request(path, { method = 'GET', body, cookie } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });


  const rawText = await response.text();

  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  const setCookies = response.headers.getSetCookie?.() ?? [];
  const rawCookie = setCookies[0] ?? response.headers.get('set-cookie');
  const cookieValue = rawCookie ? rawCookie.split(';')[0] : null;

  return {
    status: response.status,
    data,
    cookie: cookieValue,
  };
}

function expect(result, expectedStatus, label) {
  if (result.status !== expectedStatus) {
    throw new Error(
      `${label}: expected HTTP ${expectedStatus}, got ${result.status}. ` +
        `Response: ${JSON.stringify(result.data)}`,
    );
  }

  ok(`${label} (HTTP ${expectedStatus})`);
  return result.data;
}

async function run() {
  console.log(`\nBuildBond smoke test against ${BASE_URL}\n`);
  const health = await request('/health');
  expect(health, 200, 'health check');

  const clientRegistration = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Smoke Client',
      email: 'smoke-client@buildbond.dev',
      password: 'password123',
      role: 'CLIENT',
    },
  });
  expect(clientRegistration, 201, 'register client');

  const contractorRegistration = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Smoke Contractor',
      email: 'smoke-contractor@buildbond.dev',
      password: 'password123',
      role: 'CONTRACTOR',
    },
  });
  expect(contractorRegistration, 201, 'register contractor');

  const outsiderRegistration = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Nosy Outsider',
      email: 'smoke-outsider@buildbond.dev',
      password: 'password123',
      role: 'CLIENT',
    },
  });
  expect(outsiderRegistration, 201, 'register unrelated client');

  const clientCookie = clientRegistration.cookie;
  const contractorCookie = contractorRegistration.cookie;
  const outsiderCookie = outsiderRegistration.cookie;

  check(clientCookie && contractorCookie && outsiderCookie, 'all three sessions have cookies');

  const wrongRoleCreate = await request('/projects', {
    method: 'POST',
    cookie: contractorCookie,
    body: {
      title: 'Contractor cannot create this',
      milestones: [
        { title: 'Fake step one', amount_paise: 1000 },
        { title: 'Fake step two', amount_paise: 1000 },
      ],
    },
  });
  expect(wrongRoleCreate, 403, 'contractor cannot create a project');

  const created = await request('/projects', {
    method: 'POST',
    cookie: clientCookie,
    body: {
      title: 'Smoke Test Renovation',
      description: 'A project created and completed by the smoke test.',
      milestones: [
        { title: 'Demolition and prep', amount_paise: 400_000 },
        { title: 'Plumbing and electrical', amount_paise: 600_000 },
        { title: 'Paint and finish', amount_paise: 500_000 },
      ],
    },
  });
  expect(created, 201, 'client creates a project');

  const projectId = created.data.id;
  const totalPaise = 400_000 + 600_000 + 500_000;

  const detailAfterCreate = await request(`/projects/${projectId}`, {
    cookie: clientCookie,
  });
  expect(detailAfterCreate, 200, 'client can read the new project');

  const milestones = detailAfterCreate.data.milestones;
  check(milestones.length === 3, 'the project has exactly three milestones');

  const [first, second, third] = milestones;

  const outsiderRead = await request(`/projects/${projectId}`, {
    cookie: outsiderCookie,
  });
  expect(outsiderRead, 404, 'unrelated client cannot read the project');

  const jobs = await request('/jobs', { cookie: contractorCookie });
  expect(jobs, 200, 'contractor lists open jobs');
  check(
    jobs.data.jobs.some((job) => job.id === projectId),
    'the new project appears on the jobs board',
  );

  const clientAccept = await request(`/projects/${projectId}/accept`, {
    method: 'POST',
    cookie: clientCookie,
  });
  expect(clientAccept, 403, 'client cannot accept a job');

  const accept = await request(`/projects/${projectId}/accept`, {
    method: 'POST',
    cookie: contractorCookie,
  });
  expect(accept, 200, 'contractor accepts the job');

  const acceptAgain = await request(`/projects/${projectId}/accept`, {
    method: 'POST',
    cookie: contractorCookie,
  });
  expect(acceptAgain, 409, 'accepting twice is blocked');

  const submitUnfunded = await request(
    `/projects/${projectId}/milestones/${first.id}/proofs`,
    {
      method: 'POST',
      cookie: contractorCookie,
      body: {
        url: 'https://example.com/buildbond/unfunded.jpg',
        note: 'Trying to work before the client funds the escrow.',
      },
    },
  );
  expect(submitUnfunded, 409, 'cannot submit proof before funding');

  const approveUnfunded = await request(
    `/projects/${projectId}/milestones/${first.id}/approve`,
    { method: 'POST', cookie: clientCookie },
  );
  expect(approveUnfunded, 409, 'cannot approve before funding');

  const fund = await request(`/projects/${projectId}/fund`, {
    method: 'POST',
    cookie: clientCookie,
  });
  expect(fund, 200, 'client funds the demo escrow');

  const fundAgain = await request(`/projects/${projectId}/fund`, {
    method: 'POST',
    cookie: clientCookie,
  });
  expect(fundAgain, 409, 'funding twice is blocked');

  const approveWithoutProof = await request(
    `/projects/${projectId}/milestones/${first.id}/approve`,
    { method: 'POST', cookie: clientCookie },
  );
  expect(approveWithoutProof, 409, 'cannot approve without a proof');

  const submit = await request(
    `/projects/${projectId}/milestones/${first.id}/proofs`,
    {
      method: 'POST',
      cookie: contractorCookie,
      body: {
        url: 'https://example.com/buildbond/demolition.jpg',
        note: 'Demolition complete and the site has been cleaned.',
      },
    },
  );
  expect(submit, 201, 'contractor submits proof');

  const submitTwice = await request(
    `/projects/${projectId}/milestones/${first.id}/proofs`,
    {
      method: 'POST',
      cookie: contractorCookie,
      body: {
        url: 'https://example.com/buildbond/demolition-2.jpg',
        note: 'A second upload while the first is still pending.',
      },
    },
  );
  expect(submitTwice, 409, 'cannot submit two pending proofs');

  const contractorApprove = await request(
    `/projects/${projectId}/milestones/${first.id}/approve`,
    { method: 'POST', cookie: contractorCookie },
  );
  expect(contractorApprove, 403, 'contractor cannot approve a proof');

  const rejectWithoutReason = await request(
    `/projects/${projectId}/milestones/${first.id}/reject`,
    { method: 'POST', cookie: clientCookie, body: { note: '' } },
  );
  expect(rejectWithoutReason, 400, 'rejection without a reason is rejected');

  const reject = await request(
    `/projects/${projectId}/milestones/${first.id}/reject`,
    {
      method: 'POST',
      cookie: clientCookie,
      body: { note: 'The photo is too blurry to judge the finished work.' },
    },
  );
  expect(reject, 200, 'client rejects with a reason');

  const resubmit = await request(
    `/projects/${projectId}/milestones/${first.id}/proofs`,
    {
      method: 'POST',
      cookie: contractorCookie,
      body: {
        url: 'https://example.com/buildbond/demolition-retake.jpg',
        note: 'Retaken in better light. All debris removed.',
      },
    },
  );
  expect(resubmit, 201, 'contractor resubmits after rejection');

  const approve = await request(
    `/projects/${projectId}/milestones/${first.id}/approve`,
    { method: 'POST', cookie: clientCookie },
  );
  expect(approve, 200, 'client approves and releases');

  const approveAgain = await request(
    `/projects/${projectId}/milestones/${first.id}/approve`,
    { method: 'POST', cookie: clientCookie },
  );
  expect(approveAgain, 409, 'approving twice is blocked');

  const dispute = await request(`/projects/${projectId}/disputes`, {
    method: 'POST',
    cookie: clientCookie,
    body: {
      milestone_id: second.id,
      reason: 'The electrical work does not match the agreed scope.',
    },
  });
  expect(dispute, 201, 'client raises a dispute');

  const disputeId = dispute.data.id;

  const secondDispute = await request(`/projects/${projectId}/disputes`, {
    method: 'POST',
    cookie: clientCookie,
    body: {
      milestone_id: third.id,
      reason: 'A second dispute while the project is already frozen.',
    },
  });
  expect(secondDispute, 409, 'a second dispute is blocked while frozen');

  const submitWhileFrozen = await request(
    `/projects/${projectId}/milestones/${second.id}/proofs`,
    {
      method: 'POST',
      cookie: contractorCookie,
      body: {
        url: 'https://example.com/buildbond/electrical.jpg',
        note: 'Attempting work while the project is frozen.',
      },
    },
  );
  expect(submitWhileFrozen, 409, 'proof submission is blocked while frozen');

  const outsiderWithdraw = await request(
    `/projects/${projectId}/disputes/${disputeId}/withdraw`,
    { method: 'POST', cookie: outsiderCookie },
  );
  expect(outsiderWithdraw, 404, 'outsider cannot withdraw the dispute');

  const contractorWithdraw = await request(
    `/projects/${projectId}/disputes/${disputeId}/withdraw`,
    { method: 'POST', cookie: contractorCookie },
  );
  expect(contractorWithdraw, 403, 'only the raiser can withdraw');

  const withdraw = await request(
    `/projects/${projectId}/disputes/${disputeId}/withdraw`,
    { method: 'POST', cookie: clientCookie },
  );
  expect(withdraw, 200, 'raiser withdraws the dispute');

  for (const milestone of [second, third]) {
    const proof = await request(
      `/projects/${projectId}/milestones/${milestone.id}/proofs`,
      {
        method: 'POST',
        cookie: contractorCookie,
        body: {
          url: `https://example.com/buildbond/milestone-${milestone.position}.jpg`,
          note: `Work complete for ${milestone.title}.`,
        },
      },
    );
    expect(proof, 201, `contractor submits proof for milestone ${milestone.position}`);

    const approved = await request(
      `/projects/${projectId}/milestones/${milestone.id}/approve`,
      { method: 'POST', cookie: clientCookie },
    );
    expect(approved, 200, `client releases milestone ${milestone.position}`);
  }

  const finalDetail = await request(`/projects/${projectId}`, {
    cookie: clientCookie,
  });
  expect(finalDetail, 200, 'client reads the finished project');

  const project = finalDetail.data.project;
  const finalMilestones = finalDetail.data.milestones;
  const ledger = finalDetail.data.ledger;

  check(project.status === 'COMPLETED', 'the project is COMPLETED');
  check(
    finalMilestones.every((milestone) => milestone.status === 'RELEASED'),
    'every milestone is RELEASED',
  );
  check(project.deposited_paise === totalPaise, 'deposited equals the project total');
  check(project.released_paise === totalPaise, 'released equals the project total');
  check(project.held_paise === 0, 'nothing is left in demo escrow');

  const depositSum = ledger
    .filter((entry) => entry.kind === 'DEPOSIT')
    .reduce((sum, entry) => sum + entry.amount_paise, 0);

  const releaseSum = ledger
    .filter((entry) => entry.kind === 'RELEASE')
    .reduce((sum, entry) => sum + entry.amount_paise, 0);

  check(depositSum === totalPaise, 'ledger has exactly one full deposit');
  check(releaseSum === totalPaise, 'ledger releases add up to the total');
  check(
    ledger.filter((entry) => entry.kind === 'RELEASE').length === 3,
    'there are exactly three release rows',
  );

  const fundCompleted = await request(`/projects/${projectId}/fund`, {
    method: 'POST',
    cookie: clientCookie,
  });
  expect(fundCompleted, 409, 'a completed project cannot be funded');

  const disputeCompleted = await request(`/projects/${projectId}/disputes`, {
    method: 'POST',
    cookie: clientCookie,
    body: {
      milestone_id: third.id,
      reason: 'Trying to dispute a completed project.',
    },
  });
  expect(disputeCompleted, 409, 'a completed project cannot be disputed');

  const demoLogin = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'client@buildbond.dev',
      password: 'password123',
    },
  });
  expect(demoLogin, 200, 'seeded client can log in');

  const demoDashboard = await request('/projects', {
    cookie: demoLogin.cookie,
  });
  expect(demoDashboard, 200, 'seeded client sees their dashboard');
  check(
    demoDashboard.data.projects.some(
      (item) => item.title === 'Sharma Kitchen Renovation',
    ),
    'the seeded kitchen project is on the dashboard',
  );

  const kinds = finalDetail.data.events.map((event) => event.kind);
  check(kinds.includes('PROOF_REJECTED'), 'the event trail records the rejection');
  check(kinds.includes('DISPUTE_RAISED'), 'the event trail records the dispute');
  check(kinds.includes('DISPUTE_WITHDRAWN'), 'the event trail records the withdrawal');
  check(kinds.includes('PROJECT_COMPLETED'), 'the event trail records completion');

  console.log('\nPASS - BuildBond\'s full escrow flow works.\n');
}

try {
  await run();
} catch (error) {
  console.error('\nFAIL -', error.message);
  console.error('\nRead the last "ok" line above to find the step that broke.\n');
  process.exit(1);
}