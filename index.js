let path = require('path');
let express = require('express');
let session =require('express-session');
let MongoStore = require('connect-mongo')(session);
let flash = require('connect-flash');
let config = require('config-lite')(__dirname);
let routes = require('./routes');
let pkg =require('./package');
let winston = require('winston');
let expressWinston = require('express-winston');

let app=express();

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(express.static(path.join(__dirname,'public')));

app.use(session({
  name:config.session.key,
  secret: config.session.secret,
  cookie: {
    maxAge:config.session.maxAge
  },
  store: new MongoStore({
    url: config.mongodb
  })
}));

app.use(flash());

app.use(require('express-formidable')({
  uploadDir: path.join(__dirname,'public/image'),
  keepExtensions: true
}));

app.locals.blog= {
  title: pkg.name,
  description: pkg.description
};

app.use((req,res,next)=>{
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success').toString();
  res.locals.error = req.flash('error').toString();
  next();
})

app.use(expressWinston.logger({
  transports:[
    new (winston.transports.Console)({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename:'log/success.log'
    })
  ],
  meta: false
}));
routes(app);
app.use(expressWinston.errorLogger({
  transports:[
    new winston.transports.Console({
      json: true,
      colorize: true
    }),
    new winston.transports.File({
      filename: 'log/error.log'
    })
  ],
  meta: false
}));

app.use(function(err,req,res,next){
  res.render('error',{
    error: err
  });
});

if(module.parent){
  module.exports = app;
} else {
  app.listen(config.port,function(){
    console.log(`${pkg.name} listening on port ${config.port}`)
  });
}
