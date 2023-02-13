let marked = require('marked');
let Post = require('../lib/mongo').Post;

let CommentModel = require("./comments");

Post.plugin('addCommentsCount',{
  afterFind: posts=>{
    return Promise.all(posts.map(post =>{
      return CommentModel.getCommentsCount(post._id)
      .then(commentsCount=>{
        post.commentsCount = commentsCount;
        return post;
      });
    }));
  },

  afterFindOne: post=>{
    if(post){
      return CommentModel.getCommentsCount(post._id)
      .then(function(count){
        post.commentsCount = count;
        return post;
      });
    }
    return post;
  }
})
Post.plugin('contentToHtml',{
  afterFind:posts =>{
    return posts.map(function(post) {
      post.content = marked.parse(post.content);
      return post;
    });
  },

  afterFindOne: post => {
    if(post){
      post.content = marked.parse(post.content);
    }
    return post;
  }
})
module.exports = {
  create: function create(post){
    return Post.create(post).exec();
  },

  getPostById:postId => {
    return Post.findOne({_id: postId})
    .populate({ path:'author',model: 'User'})
    .addCreateAt()
    .addCommentsCount()
    .contentToHtml()
    .exec();
  },

  getPosts:author => {
    var query={};
    if(author){
      query.author = author;
    }
    return Post.find(query)
    .populate({ path:'author',model:'User'})
    .sort({_id:-1})
    .addCreateAt()
    .addCommentsCount()
    .contentToHtml()
    .exec();

  },

  incPv: function incPv(postId){
    return Post.update({_id: postId},{ $inc: {pv:1}})
    .exec();
  },

  getRawPostById: function getRawPostById(postId) {
    return Post
      .findOne({_id: postId})
      .populate({ path:'author', model:'User'})
      .exec();
  },

  updatePostById: function updatePostById(postId,author,data){
    return Post.update({ author: author,_id: postId},{ $set: data}).exec();
  },

  delPostById: function delPostById(postId,author){
    return Post.remove({ author: author,_id: postId}).exec();
  }

};