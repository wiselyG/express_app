let path = require('path');
let assert = require('assert');
let request = require('supertest');
let app =require('../index');
let User =require('../lib/mongo').User;

describe('signup',function(){
  describe("signup /POST",function(){
    let agent = request.agent(app);
   beforeEach(done =>{
    User.create({
      name:'jack',
      password:'112233',
      avatar:'',
      gender: 'x',
      bio: ''
    })
    .exec()
    .then(function(){
      done();
    }).catch(done)
   });

   afterEach(done =>{
    User.remove({name:'jack'})
    .exec()
    .then(function(){
      done();
    }).catch(done);
   });

   it("wrong name",done =>{
    agent
    .post('/signup')
    .type('form')
    .attach('avatar',path.join(__dirname,'pic1.jpg'))
    .field({name:''})
    .redirects()
    .end(function(err,res){
      if(err) return done(err);
      assert(res.text.match(/名字请限制在 1-10 个字符/gi));
      done();
    })
   });

   it("wrong gender",done=>{
     agent.post('/signup')
     .type('form')
     .attach('avatar',path.join(__dirname,'pic1.jpg'))
     .field({ name:'nswbsu',gender:'e'})
     .redirects()
     .end(function(err,res){
        if(err) return done(err);
        assert(res.text.match(/性别只能是 m、f 或 x/gi));
        done();
     });
   });
  })
})