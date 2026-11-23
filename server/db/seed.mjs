import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../src/db.js';
import { config } from '../src/config.js';

const DEMO_PASSWORD = 'password123';

function rupees(paise) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

async function addEvent(client, projectId, actorId, kind, message, ago) {
  await client.query(
    `INSERT INTO events (project_id, actor_id, kind, message, created_at)
     VALUES ($1, $2, $3, $4, now() - $5::interval)`,
    [projectId, actorId, kind, message, ago],
  );
}

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, config.bcryptRounds);

  await withTransaction(async (client) => {
    const clientResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'CLIENT')
       RETURNING id`,
      ['Aarav Sharma', 'client@buildbond.dev', passwordHash],
    );
    const clientId = clientResult.rows[0].id;

    const contractorResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'CONTRACTOR')
       RETURNING id`,
      ['Rohan Verma', 'contractor@buildbond.dev', passwordHash],
    );
    const contractorId = contractorResult.rows[0].id;

    const KITCHEN_TOTAL = 15_000_000; // 1,50,000 rupees in paise

    const projectResult = await client.query(
      `INSERT INTO projects
         (client_id, contractor_id, title, description, total_paise, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', now() - interval '6 days')
       RETURNING id`,
      [
        clientId,
        contractorId,
        'Sharma Kitchen Renovation',
        'A full kitchen refresh: demolition, new plumbing and electrical lines, then tiling and paint.',
        KITCHEN_TOTAL,
      ],
    );
    const kitchenProjectId = projectResult.rows[0].id;

    const kitchenSteps = [
      {
        title: 'Demolition and site preparation',
        amount: 4_000_000, // 40,000 rupees
        status: 'RELEASED',
      },
      {
        title: 'Plumbing and electrical rough-in',
        amount: 6_000_000, // 60,000 rupees
        status: 'SUBMITTED',
      },
      {
        title: 'Painting, tiling and final finish',
        amount: 5_000_000, // 50,000 rupees
        status: 'PENDING',
      },
    ];

    const kitchenMilestoneIds = [];

    for (const [index, step] of kitchenSteps.entries()) {
      const milestoneResult = await client.query(
        `INSERT INTO milestones
           (project_id, position, title, amount_paise, status, created_at)
         VALUES ($1, $2, $3, $4, $5, now() - interval '6 days')
         RETURNING id`,
        [
          kitchenProjectId,
          index + 1,
          step.title,
          step.amount,
          step.status,
        ],
      );

      kitchenMilestoneIds.push(milestoneResult.rows[0].id);
    }

    await client.query(
      `INSERT INTO proofs
         (milestone_id, submitted_by, url, note, status, review_note, reviewed_by, reviewed_at, created_at)
       VALUES ($1, $2, $3, $4, 'APPROVED', $5, $6, now() - interval '3 days', now() - interval '4 days')`,
      [
        kitchenMilestoneIds[0],
        contractorId,
        'https://example.com/buildbond/demolition-proof.jpg',
        'Old cabinets and flooring removed. Site cleaned and ready for the next stage.',
        'Approved. The site was clean and the old units were removed.',
        clientId,
      ],
    );

    await client.query(
      `INSERT INTO proofs
         (milestone_id, submitted_by, url, note, status, created_at)
       VALUES ($1, $2, $3, $4, 'SUBMITTED', now() - interval '1 day')`,
      [
        kitchenMilestoneIds[1],
        contractorId,
        'https://example.com/buildbond/plumbing-proof.jpg',
        'New water lines and electrical conduit installed. Pressure test passed this morning.',
      ],
    );

    await client.query(
      `INSERT INTO ledger_entries
         (project_id, milestone_id, kind, amount_paise, note, created_at)
       VALUES ($1, NULL, 'DEPOSIT', $2, $3, now() - interval '5 days')`,
      [kitchenProjectId, KITCHEN_TOTAL, 'Demo escrow deposit'],
    );

    await client.query(
      `INSERT INTO ledger_entries
         (project_id, milestone_id, kind, amount_paise, note, created_at)
       VALUES ($1, $2, 'RELEASE', $3, $4, now() - interval '3 days')`,
      [
        kitchenProjectId,
        kitchenMilestoneIds[0],
        kitchenSteps[0].amount,
        'Released after proof approval',
      ],
    );

    await addEvent(
      client,
      kitchenProjectId,
      clientId,
      'PROJECT_CREATED',
      'Aarav Sharma created "Sharma Kitchen Renovation".',
      '6 days',
    );
    await addEvent(
      client,
      kitchenProjectId,
      contractorId,
      'CONTRACTOR_ACCEPTED',
      'Rohan Verma accepted the project.',
      '5 days',
    );
    await addEvent(
      client,
      kitchenProjectId,
      clientId,
      'PROJECT_FUNDED',
      `Aarav Sharma deposited ${rupees(KITCHEN_TOTAL)} into demo escrow.`,
      '5 days',
    );
    await addEvent(
      client,
      kitchenProjectId,
      clientId,
      'MILESTONE_RELEASED',
      `${rupees(kitchenSteps[0].amount)} released for "Demolition and site preparation".`,
      '3 days',
    );
    await addEvent(
      client,
      kitchenProjectId,
      contractorId,
      'PROOF_SUBMITTED',
      'Rohan Verma submitted proof for "Plumbing and electrical rough-in".',
      '1 day',
    );

    const BATHROOM_TOTAL = 8_000_000; // 80,000 rupees in paise

    const openProjectResult = await client.query(
      `INSERT INTO projects
         (client_id, contractor_id, title, description, total_paise, status, created_at)
       VALUES ($1, NULL, $2, $3, $4, 'OPEN', now() - interval '2 days')
       RETURNING id`,
      [
        clientId,
        'Mehta Bathroom Remodel',
        'Strip out the old bathroom, waterproof the floor, then tile and fit new fixtures.',
        BATHROOM_TOTAL,
      ],
    );
    const bathroomProjectId = openProjectResult.rows[0].id;

    const bathroomSteps = [
      { title: 'Strip-out and waterproofing', amount: 3_000_000 }, // 30,000
      { title: 'Tiling, fixtures and final clean', amount: 5_000_000 }, // 50,000
    ];

    for (const [index, step] of bathroomSteps.entries()) {
      await client.query(
        `INSERT INTO milestones
           (project_id, position, title, amount_paise, status, created_at)
         VALUES ($1, $2, $3, $4, 'PENDING', now() - interval '2 days')`,
        [bathroomProjectId, index + 1, step.title, step.amount],
      );
    }

    await addEvent(
      client,
      bathroomProjectId,
      clientId,
      'PROJECT_CREATED',
      'Aarav Sharma created "Mehta Bathroom Remodel" and is waiting for a contractor.',
      '2 days',
    );
  });

  console.log('\nDemo data created.\n');
  console.log('  Client:      client@buildbond.dev / password123');
  console.log('  Contractor:  contractor@buildbond.dev / password123\n');
  console.log('  Active project:  Sharma Kitchen Renovation (1 proof waiting for review)');
  console.log('  Open job:        Mehta Bathroom Remodel (visible on the contractor jobs board)\n');
}

seed()
  .catch((error) => {
    if (error.code === '23505') {
      console.error('\nThis database already contains demo data.');
      console.error('Run "npm run db:reset" first, then "npm run db:seed".\n');
    } else {
      console.error('\nSeed failed:', error.message);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });