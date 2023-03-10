let express =require('express');
let PostModel = require('../models/posts');
let CommentModel = require("../models/comments");

let router =express.Router();

let checkLogin = require('../middlewares/check').checkLogin;

router.get('/',(req,res,next)=>{
  var author = req.query.author;
  PostModel.getPosts(author)
  .then(posts =>{
    posts.forEach(post =>{
      CommentModel.getCommentsCount(post._id)
      .then(count=>{
        post.CommentCount=count;
      })
    })
    res.render('posts',{
      posts: posts
    });
  })
  .catch(next)
});

// POST /posts 发表一篇文章
router.post('/', checkLogin, function(req, res, next) {
  let author = req.session.user._id;
  let title = req.fields.title;
  let content = req.fields.content;

  try{
    if (!title.length) {
      throw new Error('请填写标题');
    }
    if (!content.length) {
      throw new Error('请填写内容');
    }
  } catch (e) {
    req.flash('error', e.message);
    return res.redirect('back');
  }

  let post ={
    author: author,
    title: title,
    content: content,
    pv:0
  }

  PostModel.create(post)
  .then(result =>{
    post= result.ops[0];
    req.flash('success',"发表成功");
    res.redirect('/posts/'+post._id);
  })
  .catch(next);
});

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function(req, res, next) {
  res.render('create');
});

// GET /posts/:postId 单独一篇的文章页
router.get('/:postId', function(req, res, next) {
  let postId = req.params.postId;
  Promise.all([
    PostModel.getPostById(postId),
    CommentModel.getComments(postId),
    PostModel.incPv(postId)
  ])
  .then(result => {
    let post =result[0];
    let comments = result[1]
    if(!post){
      throw new Error('该文章不存在')
    }
    res.render('post',{
      post:post,
      comments: comments
    });
  })
  .catch(next);
});

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, function(req, res, next) {
  let postId =req.params.postId;
  let author = req.session.user._id;
  
  PostModel.getRawPostById(postId)
  .then(post =>{
    if(!post){
      throw new Error('该文章不存在');
    }
    if( author.toString() !== post.author._id.toString()){
      throw new Error('权限不足');
    }
    res.render('edit',{
      post:post
    });
  })
  .catch(next);
});

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function(req, res, next) {
  let postId =req.params.postId;
  let author =req.session.user._id;
  let title = req.fields.title;
  let content = req.fields.content;

  PostModel.updatePostById(postId, author, {title: title,content: content})
    .then(function(){
      req.flash('success','编辑文章成功');
      res.redirect('/posts/'+postId);
    })
    .catch(next);
});

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function(req, res, next) {
  let postId =req.params.postId;
  let author =req.session.user._id;

  PostModel.delPostById(postId,author)
    .then(function(){
      req.flash('success', '删除文章成功');
      res.redirect('/posts')
    })
    .catch(next);
});

// POST /posts/:postId/comment 创建一条留言
router.post('/:postId/comment', checkLogin, function(req, res, next) {
  let author =req.session.user._id;
  let postId=req.params.postId;
  let content = req.fields.content;

  let comment={
    author: author,
    postId: postId,
    content: content
  };

  CommentModel.create(comment)
  .then(function(){
    req.flash('success','留言成功');
    res.redirect('back');
  })
  .catch(next);

});

// GET /posts/:postId/comment/:commentId/remove 删除一条留言
router.get('/:postId/comment/:commentId/remove', checkLogin, function(req, res, next) {
  let commentId=req.params.commentId;
  let author =req.session.user._id;
  CommentModel.delCommentById(commentId,author)
  .then(function(){
    req.flash('success','删除留言成功');
    res.redirect('back');
  })
  .catch(next)
});

module.exports = router;