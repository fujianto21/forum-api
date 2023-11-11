const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const AddThread = require('../../../Domains/threads/entities/AddThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('verifyAvailableThreadById function', () => {
    it('should throw NotFoundError if thread not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);
      const threadId = 'thread-000';

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyAvailableThreadById(threadId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError if thread available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);
      const userId = 'user-456';
      await UsersTableTestHelper.addUser({ id: userId });
      const threadId = 'thread-456';
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyAvailableThreadById(threadId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('addThread function', () => {
    it('should return added thread correctly', async () => {
      // Arrange
      const userId = 'user-789';
      await UsersTableTestHelper.addUser({ id: userId });
      const addThread = new AddThread({
        title: 'Example Title',
        body: 'Example Body',
        owner: userId,
      });
      const fakeIdGenerator = () => '789'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(addThread);

      // Assert
      const thread = await ThreadsTableTestHelper.findThreadById(addedThread.id);
      expect(thread).toHaveLength(1);
      expect(addedThread).toStrictEqual(new AddedThread({
        id: `thread-${fakeIdGenerator()}`,
        title: addThread.title,
        owner: addThread.owner,
      }));
    });
  });

  describe('getDetailThreadById function', () => {
    it('should throw NotFoundError if thread not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);
      const threadId = 'thread-000';

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadById(threadId)).rejects.toThrow(NotFoundError);
    });

    it('should get detail thread correctly', async () => {
      // Arrange
      const threadRepository = new ThreadRepositoryPostgres(pool, {});
      const userPayload = { id: 'user-123', username: 'dicoding123' };
      const threadPayload = {
        id: 'thread-123',
        title: 'Example Title',
        body: 'Example Body',
        owner: userPayload.id,
      };
      await UsersTableTestHelper.addUser(userPayload);
      await ThreadsTableTestHelper.addThread(threadPayload);

      // Action
      const threadResult = await threadRepository.getThreadById(threadPayload.id);

      // Assert
      expect(threadResult).toBeDefined();
      expect(threadResult.id).toEqual(threadPayload.id);
      expect(threadResult.title).toEqual(threadPayload.title);
      expect(threadResult.body).toEqual(threadPayload.body);
      expect(threadResult.username).toEqual(userPayload.username);
    });
  });
});
