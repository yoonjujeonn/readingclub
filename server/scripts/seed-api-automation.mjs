const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000/api';
const RUN_ID = process.env.AUTO_RUN_ID || new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const PASSWORD = process.env.AUTO_SEED_PASSWORD || '12341234';

const users = Array.from({ length: 6 }, (_, index) => {
  const number = index + 1;
  return {
    email: `auto${number}@test.com`,
    password: PASSWORD,
    nickname: `auto${number}`,
  };
});

const groupPlans = [
  {
    ownerIndex: 0,
    memberIndexes: [1, 2, 3],
    payload: {
      bookTitle: 'The Pragmatic Programmer',
      bookAuthor: 'Andrew Hunt, David Thomas',
      bookSummary: 'A practical book about software craftsmanship and engineering judgment.',
      name: `Auto API Reading Club ${RUN_ID}`,
      description: 'Created by API automation for multi-user group, memo, and thread testing.',
      maxMembers: 8,
      readingStartDate: offsetDate(1),
      readingEndDate: offsetDate(21),
      isPrivate: false,
    },
  },
  {
    ownerIndex: 3,
    memberIndexes: [0, 4, 5],
    payload: {
      bookTitle: 'Clean Architecture',
      bookAuthor: 'Robert C. Martin',
      bookSummary: 'A discussion-friendly book about software boundaries and maintainable systems.',
      name: `Auto Architecture Circle ${RUN_ID}`,
      description: 'Created by API automation to test a second group with overlapping members.',
      maxMembers: 8,
      readingStartDate: offsetDate(2),
      readingEndDate: offsetDate(28),
      isPrivate: false,
    },
  },
];

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error?.message || data?.message || response.statusText;
    throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${message}`);
  }

  return data;
}

async function signupAndLogin(user) {
  try {
    await request('/auth/signup', {
      method: 'POST',
      body: user,
    });
    console.log(`Created account: ${user.email}`);
  } catch (error) {
    if (!error.message.includes('(409)')) {
      throw error;
    }
    console.log(`Account already exists, logging in: ${user.email}`);
  }

  const tokens = await request('/auth/login', {
    method: 'POST',
    body: {
      email: user.email,
      password: user.password,
    },
  });

  return { ...user, ...tokens };
}

async function main() {
  console.log(`API base URL: ${API_BASE_URL}`);
  console.log(`Automation run id: ${RUN_ID}`);

  const accounts = [];
  for (const user of users) {
    const account = await signupAndLogin(user);
    accounts.push(account);
  }

  const createdGroups = [];
  const createdMemos = [];
  const createdDiscussions = [];
  const createdComments = [];
  const createdReplies = [];

  for (const plan of groupPlans) {
    const owner = accounts[plan.ownerIndex];
    const group = await request('/groups', {
      method: 'POST',
      token: owner.accessToken,
      body: plan.payload,
    });
    createdGroups.push(group);
    console.log(`Created group: ${group.name}`);

    const members = [owner, ...plan.memberIndexes.map((index) => accounts[index])];
    for (const member of members.slice(1)) {
      await request(`/groups/${group.id}/join`, {
        method: 'POST',
        token: member.accessToken,
        body: {},
      });
      console.log(`Joined ${member.nickname} to ${group.name}`);
    }

    for (let index = 0; index < members.length; index++) {
      const member = members[index];
      const progress = 80 + index * 25;

      await request(`/groups/${group.id}/progress`, {
        method: 'PATCH',
        token: member.accessToken,
        body: { readingProgress: progress },
      });

      const memo = await request(`/groups/${group.id}/memos`, {
        method: 'POST',
        token: member.accessToken,
        body: {
          pageStart: 10 + index * 12,
          pageEnd: 18 + index * 12,
          content: `${member.nickname} memo for ${group.name}. This note was generated through the public API and mentions responsibility, pacing, and useful discussion hooks.`,
          visibility: index % 3 === 0 ? 'public' : index % 3 === 1 ? 'spoiler' : 'private',
        },
      });
      createdMemos.push(memo);
      console.log(`Created memo: ${memo.id}`);
    }

    const groupMemos = createdMemos.filter((memo) => memo.groupId === group.id);
    for (let index = 0; index < 3; index++) {
      const author = members[index % members.length];
      const memo = groupMemos[index % groupMemos.length];
      const discussion = await request(`/groups/${group.id}/discussions`, {
        method: 'POST',
        token: author.accessToken,
        body: {
          title: `Auto thread ${index + 1} for ${group.name}`,
          content: `Generated discussion topic ${index + 1}. What should the group compare, challenge, or carry into the next session?`,
          memoId: memo.id,
          endDate: offsetDate(14 + index),
        },
      });
      createdDiscussions.push(discussion);
      console.log(`Created discussion: ${discussion.title}`);

      const commenter = members[(index + 1) % members.length];
      const comment = await request(`/discussions/${discussion.id}/comments`, {
        method: 'POST',
        token: commenter.accessToken,
        body: {
          content: `I want to connect this topic with the memo and ask how the idea changes later in the book.`,
        },
      });
      createdComments.push(comment);

      const replier = members[(index + 2) % members.length];
      const reply = await request(`/comments/${comment.id}/replies`, {
        method: 'POST',
        token: replier.accessToken,
        body: {
          content: 'Good point. I would like to revisit this after the next reading checkpoint.',
        },
      });
      createdReplies.push(reply);
    }
  }

  console.log('');
  console.log('Automation completed.');
  console.table({
    users: accounts.length,
    groups: createdGroups.length,
    memos: createdMemos.length,
    discussions: createdDiscussions.length,
    comments: createdComments.length,
    replies: createdReplies.length,
  });
  console.log(`Password for generated accounts: ${PASSWORD}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
