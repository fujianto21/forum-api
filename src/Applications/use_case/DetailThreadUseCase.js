class DetailThreadUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);
    const formattedComments = this._formatComments(comments);
    const formattedReplies = this._formatReplies(replies);
    // eslint-disable-next-line max-len
    const commentsWithReplies = this._insertRepliesIntoComments(formattedComments, formattedReplies);
    return {
      ...thread,
      comments: commentsWithReplies,
    };
  }

  _formatComments(comments) {
    return comments.map((comment) => ({
      id: comment.id,
      date: comment.date,
      username: comment.username,
      content: comment.is_delete ? '**komentar telah dihapus**' : comment.content,
    }));
  }

  _formatReplies(replies) {
    return replies.map((reply) => ({
      id: reply.id,
      date: reply.date,
      username: reply.username,
      comment_id: reply.comment_id,
      content: reply.is_delete ? '**balasan telah dihapus**' : reply.content,
    }));
  }

  _insertRepliesIntoComments(comments, replies) {
    return comments.map((comment) => {
      const commentWithReplies = { ...comment };
      commentWithReplies.replies = replies
        .filter((reply) => reply.comment_id === comment.id)
        // eslint-disable-next-line camelcase
        .map(({ comment_id, ...rest }) => rest);
      return commentWithReplies;
    });
  }
}

module.exports = DetailThreadUseCase;
