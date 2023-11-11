const DeleteReply = require('../../Domains/replies/entities/DeleteReply');

class DeleteReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const {
      replyId,
      commentId,
      threadId,
      owner,
    } = new DeleteReply(useCasePayload);

    await this._threadRepository.verifyAvailableThreadById(threadId);
    await this._commentRepository.verifyAvailableCommentById(commentId);
    await this._replyRepository.verifyAvailableReplyById(replyId);
    await this._replyRepository.verifyReplyByOwner(replyId, owner);
    return this._replyRepository.softDeleteReplyById(replyId);
  }
}

module.exports = DeleteReplyUseCase;
