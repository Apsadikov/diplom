var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let handlebars = require('hbs');

var indexRouter = require('./routes/index');

var app = express();
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'hbs');

handlebars.registerPartials(path.join(__dirname, 'public/views'))


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

module.exports = app;
