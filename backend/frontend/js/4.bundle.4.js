(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{204:function(e,t,n){const i=n(6),s=n(2),a=n(286),o=n(287),r=n(291),c=n(208),_=n(211);e.exports=i.View.extend({id:"audit-log",template:r,ui:{list_region:".list-region",dimmer:".dimmer",search:".search-form",query:'input[name="source-query"]'},fetch:s.Api.AuditLog.getAll,showData:function(e){this.showChildView("list_region",new o({collection:new a.Collection(e)}))},showError:function(e){this.showChildView("list_region",new c({code:e.code,message:e.message,retry:function(){s.Controller.showAuditLog()}})),console.error(e)},showEmpty:function(){this.showChildView("list_region",new _({title:s.i18n("audit-log","empty"),subtitle:s.i18n("audit-log","empty-subtitle")}))},regions:{list_region:"@ui.list_region"},events:{"submit @ui.search":function(e){e.preventDefault();let t=this.ui.query.val();this.fetch(["user"],t).then(e=>this.showData(e)).catch(e=>{this.showError(e)})}},onRender:function(){let e=this;e.fetch(["user"]).then(t=>{!e.isDestroyed()&&t&&t.length?e.showData(t):e.showEmpty()}).catch(t=>{e.showError(t)}).then(()=>{e.ui.dimmer.removeClass("active")})}})},208:function(e,t,n){const i=n(6),s=n(209);e.exports=i.View.extend({template:s,className:"alert alert-icon alert-warning m-5",ui:{retry:"a.retry"},events:{"click @ui.retry":function(e){e.preventDefault(),this.getOption("retry")()}},templateContext:function(){return{message:this.getOption("message"),code:this.getOption("code"),retry:"function"==typeof this.getOption("retry")}}})},209:function(module,exports,__webpack_require__){(function(_){module.exports=function(obj){obj||(obj={});var __t,__p="",__e=_.escape,__j=Array.prototype.join;function print(){__p+=__j.call(arguments,"")}with(obj)__p+='<i class="fe fe-alert-triangle mr-2" aria-hidden="true"></i>\n'+(null==(__t=code?"<strong>"+code+"</strong> &mdash; ":"")?"":__t)+"\n"+__e(message)+"\n\n",retry&&(__p+='\n    <br><br><a href="#" class="btn btn-sm btn-warning retry">'+__e(i18n("str","try-again"))+"</a>\n"),__p+="\n";return __p}}).call(this,__webpack_require__(3))},211:function(e,t,n){const i=n(6),s=n(212);e.exports=i.View.extend({className:"text-center m-7",template:s,options:{btn_color:"teal"},ui:{action:"a"},events:{"click @ui.action":function(e){e.preventDefault(),this.getOption("action")()}},templateContext:function(){return{title:this.getOption("title"),subtitle:this.getOption("subtitle"),link:this.getOption("link"),action:"function"==typeof this.getOption("action"),btn_color:this.getOption("btn_color")}}})},212:function(module,exports,__webpack_require__){(function(_){module.exports=function(obj){obj||(obj={});var __t,__p="",__e=_.escape,__j=Array.prototype.join;function print(){__p+=__j.call(arguments,"")}with(obj)title&&(__p+='\n    <h1 class="h2 mb-3">'+__e(title)+"</h1>\n"),subtitle&&(__p+='\n    <p class="h4 text-muted font-weight-normal mb-7">'+__e(subtitle)+"</p>\n"),link&&(__p+='\n    <a class="btn btn-'+__e(btn_color)+'" href="#">'+__e(link)+"</a>\n"),__p+="\n";return __p}}).call(this,__webpack_require__(3))},286:function(e,t,n){const i=n(5),s=i.Model.extend({idAttribute:"id",defaults:function(){return{name:""}}});e.exports={Model:s,Collection:i.Collection.extend({model:s})}},287:function(e,t,n){const i=n(6),s=n(288),a=n(290),o=i.CollectionView.extend({tagName:"tbody",childView:s});e.exports=i.View.extend({tagName:"table",className:"table table-hover table-outline table-vcenter card-table",template:a,regions:{body:{el:"tbody",replaceElement:!0}},onRender:function(){this.showChildView("body",new o({collection:this.collection}))}})},288:function(e,t,n){const i=n(6),s=n(11),a=n(289);e.exports=i.View.extend({template:a,tagName:"tr",ui:{meta:"a.meta"},events:{"click @ui.meta":function(e){e.preventDefault(),s.showAuditMeta(this.model)}},templateContext:{more:function(){switch(this.object_type){case"redirection-host":case"stream":case"proxy-host":return this.meta.domain_names.join(", ")}return"#"+(this.object_id||"?")}}})},289:function(module,exports,__webpack_require__){(function(_){module.exports=function(obj){obj||(obj={});var __t,__p="",__e=_.escape,__j=Array.prototype.join;function print(){__p+=__j.call(arguments,"")}with(obj){__p+='<td class="text-center">\n    <div class="avatar d-block" style="background-image: url('+__e(user.avatar||"/images/default-avatar.jpg")+')">\n        <span class="avatar-status '+__e(user.is_disabled?"bg-red":"bg-green")+'"></span>\n    </div>\n</td>\n<td>\n    <div>\n        ',user.is_deleted?__p+='\n            <span class="mdi-format-strikethrough" title="Deleted">'+__e(user.name)+"</span>\n            ":__p+="\n            "+__e(user.name)+"\n            ",__p+="\n    </div>\n</td>\n<td>\n    <div>\n        ";var items=[];switch(object_type){case"proxy-host":__p+=' <span class="text-success"><i class="fe fe-zap"></i></span> ',items=meta.domain_names;break;case"redirection-host":__p+=' <span class="text-yellow"><i class="fe fe-shuffle"></i></span> ',items=meta.domain_names;break;case"stream":__p+=' <span class="text-blue"><i class="fe fe-radio"></i></span> ',items.push(meta.incoming_port);break;case"dead-host":__p+=' <span class="text-danger"><i class="fe fe-zap-off"></i></span> ',items=meta.domain_names;break;case"access-list":__p+=' <span class="text-teal"><i class="fe fe-lock"></i></span> ',items.push(meta.name);break;case"user":__p+=' <span class="text-teal"><i class="fe fe-user"></i></span> ',items.push(meta.name);break;case"certificate":__p+=' <span class="text-pink"><i class="fe fe-shield"></i></span> ',"letsencrypt"===meta.provider?items=meta.domain_names:items.push(meta.nice_name)}__p+="&nbsp;"+__e(i18n("audit-log",action,{name:i18n("audit-log",object_type)}))+"\n        &mdash;\n        ",items&&items.length?items.map((function(e){__p+='\n                <span class="tag">'+__e(e)+"</span>\n                "})):__p+="\n            #"+__e(object_id)+"\n            ",__p+='\n    </div>\n    <div class="small text-muted">\n        '+__e(formatDbDate(created_on,"Do MMMM YYYY, h:mm a"))+'\n    </div>\n</td>\n<td class="text-right">\n    <a href="#" class="meta btn btn-secondary btn-sm">'+__e(i18n("audit-log","view-meta"))+"</a>\n</td>\n"}return __p}}).call(this,__webpack_require__(3))},290:function(module,exports){module.exports=function(obj){obj||(obj={});var __t,__p="";with(obj)__p+='<thead>\n    <th width="30">&nbsp;</th>\n    <th>User</th>\n    <th>Event</th>\n    <th>&nbsp;</th>\n</thead>\n<tbody>\n    \x3c!-- items --\x3e\n</tbody>\n';return __p}},291:function(module,exports,__webpack_require__){(function(_){module.exports=function(obj){obj||(obj={});var __t,__p="",__e=_.escape;with(obj)__p+='<div class="card">\n    <div class="card-status bg-teal"></div>\n    <div class="card-header">\n        <h3 class="card-title">'+__e(i18n("audit-log","title"))+'</h3>\n        <div class="card-options">\n            <form class="search-form" role="search">\n                <div class="input-icon">\n                    <span class="input-icon-addon">\n                      <i class="fe fe-search"></i>\n                    </span>\n                    <input name="source-query" type="text" value="" class="form-control form-control-sm" placeholder="'+__e(i18n("audit-log","search"))+'" aria-label="'+__e(i18n("audit-log","search"))+'">\n                </div>\n            </form>\n        </div>\n    </div>\n    <div class="card-body no-padding min-100">\n        <div class="dimmer active">\n            <div class="loader"></div>\n            <div class="dimmer-content list-region">\n                \x3c!-- List Region --\x3e\n            </div>\n        </div>\n\n    </div>\n</div>\n';return __p}}).call(this,__webpack_require__(3))}}]);