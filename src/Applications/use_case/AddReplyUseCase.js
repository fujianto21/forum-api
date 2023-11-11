const AddReply = require('../../Domains/replies/entities/AddReply');

class AddReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    await this._threadRepository.verifyAvailableThreadById(useCasePayload.threadId);
    await this._commentRepository.verifyAvailableCommentById(useCasePayload.commentId);
    const addReply = new AddReply(useCasePayload);
    return this._replyRepository.addReply(addReply);
  }
}

module.exports = AddReplyUseCase;
