let marked = require('marked');
let Comment =require('../lib/mongo').Comment;

Comment.plugin('contentToHtml',{
  afterFind: function(comments){
    return comments.map(function(comment){
      comment.content = marked.parse(comment.content);
      return comment;
    });
  }
});

module.exports ={
  create: function create(comment){
    return Comment.create(comment).exec();
  },

  delCommentById: function delCommentById(commentId,author){
    return Comment.remove({ author: author,_id:commentId}).exec();
  },

  getComments: postId =>{
    return Comment
    .find({postId: postId})
    .populate({ path:'author',model:'User'})
    .sort({_id:1})
    .addCreateAt()
    .contentToHtml()
    .exec();
  },

  getCommentsCount: postId=>{
    return Comment.count({postId: postId}).exec();
  }
}