const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('verifyAvailableCommentById function', () => {
    it('should throw NotFoundError if comment not available', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const commentId = 'comment-000';

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyAvailableCommentById(commentId))
        .rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError if comment available', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId });
      const threadId = 'thread-123';
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      const commentId = 'comment-123';
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId });

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyAvailableCommentById(commentId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('addComment function', () => {
    it('should return added comment correctly', async () => {
      // Arrange
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId });
      const threadId = 'thread-123';
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      const addComment = new AddComment({
        threadId,
        content: 'Example Comment',
        owner: userId,
      });
      const fakeIdGenerator = () => '123'; // stub!
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(addComment);

      // Assert
      const comment = await CommentsTableTestHelper.findCommentById(addedComment.id);
      expect(comment).toHaveLength(1);
      expect(addedComment).toStrictEqual(new AddedComment({
        id: `comment-${fakeIdGenerator()}`,
        content: addComment.content,
        owner: addComment.owner,
      }));
    });
  });

  describe('verifyCommentByOwner function', () => {
    it('should throw AuthorizationError if owner is not valid', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId });
      const threadId = 'thread-123';
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      const commentId = 'comment-123';
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId });
      const inValidUserId = 'user-456';

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentByOwner(commentId, inValidUserId))
        .rejects.toThrow(AuthorizationError);
    });

    it('should not throw AuthorizationError if owner is valid', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId });
      const threadId = 'thread-123';
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      const commentId = 'comment-123';
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId });

      // Action & Assert
      await expect(commentRepositoryPostgres.verifyCommentByOwner(commentId, userId))
        .resolves.not.toThrow(AuthorizationError);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should get comments by threadId correctly', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const userPayload = {
        id: 'user-123',
        username: 'user123',
      };
      await UsersTableTestHelper.addUser(userPayload);
      const threadId = 'thread-123';
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userPayload.id });
      const commentPayload = {
        id: 'comment-123',
        threadId,
        content: 'Example Comment',
        owner: userPayload.id,
      };
      await CommentsTableTestHelper.addComment(commentPayload);

      // Action
      const commentsResult = await commentRepositoryPostgres.getCommentsByThreadId(threadId);

      // Assert
      expect(commentsResult).toBeDefined();
      expect(commentsResult).toHaveLength(1);
      expect(commentsResult[0].id).toEqual(commentPayload.id);
      expect(commentsResult[0].content).toEqual(commentPayload.content);
      expect(commentsResult[0].username).toEqual(userPayload.username);
    });

    it('should get empty array when comments by threadId is empty', async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId });
      const threadId = 'thread-123';
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });

      // Action
      const commentsResult = await commentRepositoryPostgres.getCommentsByThreadId(threadId);

      // Assert
      expect(commentsResult).toBeDefined();
      expect(commentsResult).toHaveLength(0);
    });
  });

  describe('softDeleteCommentById function', () => {
    it('should throw NotFoundError when comment not found or invalid', () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      // Action & Assert
      return expect(commentRepositoryPostgres.softDeleteCommentById('comment-000'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should return delete comment correctly', async () => {
      // Arrange
      const userId = 'user-123';
      await UsersTableTestHelper.addUser({ id: userId });
      const threadId = 'thread-123';
      await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
      const commentId = 'comment-123';
      await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      // Action
      await commentRepositoryPostgres.softDeleteCommentById(commentId);

      // Assert
      const commentResult = await CommentsTableTestHelper.findCommentById(commentId);
      expect(commentResult).toBeDefined();
      expect(commentResult).toHaveLength(1);
      expect(commentResult[0].is_delete).toEqual(true);
    });
  });
});
