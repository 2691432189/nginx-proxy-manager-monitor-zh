(window.webpackJsonp=window.webpackJsonp||[]).push([[13],{197:function(e,n,s){(function(n){const t=s(6),i=s(2),a=s(220),l=s(271),o=s(272),c=s(274);s(210);const r=t.CollectionView.extend({childView:o}),d=t.CollectionView.extend({childView:c});e.exports=t.View.extend({template:l,className:"modal-dialog",ui:{items_region:".items",clients_region:".clients",form:"form",buttons:".modal-footer button",cancel:"button.cancel",save:"button.save",access_add:"button.access_add",auth_add:"button.auth_add"},regions:{items_region:"@ui.items_region",clients_region:"@ui.clients_region"},events:{"click @ui.save":function(e){if(e.preventDefault(),!this.ui.form[0].checkValidity())return void n('<input type="submit">').hide().appendTo(this.ui.form).click().remove();let s=this,t=this.ui.form.serializeJSON(),a=[],l=[];if(t.username.map((function(e,n){e.trim().length&&a.push({username:e.trim(),password:t.password[n]})})),t.address.map((function(e,n){e.trim().length&&l.push({address:e.trim(),directive:t.directive[n]})})),!a.length&&!l.length)return void alert("You must specify at least 1 Authorization or Access rule");let o={name:t.name,satisfy_any:!!t.satisfy_any,pass_auth:!!t.pass_auth,items:a,clients:l};console.log(o);let c=i.Api.Nginx.AccessLists.create,r=!0;this.model.get("id")&&(r=!1,c=i.Api.Nginx.AccessLists.update,o.id=this.model.get("id")),this.ui.buttons.prop("disabled",!0).addClass("btn-disabled"),c(o).then(e=>{s.model.set(e),i.UI.closeModal((function(){r&&i.Controller.showNginxAccess()}))}).catch(e=>{alert(e.message),this.ui.buttons.prop("disabled",!1).removeClass("btn-disabled")})},"click @ui.access_add":function(e){e.preventDefault();let n=this.model.get("clients");n.push({}),this.showChildView("clients_region",new d({collection:new Backbone.Collection(n)}))},"click @ui.auth_add":function(e){e.preventDefault();let n=this.model.get("items");n.push({}),this.showChildView("items_region",new r({collection:new Backbone.Collection(n)}))}},onRender:function(){let e=this.model.get("items"),n=this.model.get("clients");e.length||e.push({}),n.length||n.push({}),this.showChildView("items_region",new r({collection:new Backbone.Collection(e)})),this.showChildView("clients_region",new d({collection:new Backbone.Collection(n)}))},initialize:function(e){void 0!==e.model&&e.model||(this.model=new a.Model)}})}).call(this,s(4))},210:function(e,n,s){var t,i,a;
/*!
  SerializeJSON jQuery plugin.
  https://github.com/marioizquierdo/jquery.serializeJSON
  version 2.9.0 (Jan, 2018)

  Copyright (c) 2012-2018 Mario Izquierdo
  Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
  and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
*/i=[s(4)],void 0===(a="function"==typeof(t=function(e){"use strict";e.fn.serializeJSON=function(n){var s,t,i,a,l,o,c,r,d,u,p,m;return s=e.serializeJSON,t=this,i=s.setupOpts(n),a=t.serializeArray(),s.readCheckboxUncheckedValues(a,i,t),l={},e.each(a,(function(e,n){o=n.name,c=n.value,d=s.extractTypeAndNameWithNoType(o),u=d.nameWithNoType,(p=d.type)||(p=s.attrFromInputWithName(t,o,"data-value-type")),s.validateType(o,p,i),"skip"!==p&&(m=s.splitInputNameIntoKeysArray(u),!(r=s.parseValue(c,o,p,i))&&s.shouldSkipFalsy(t,o,u,p,i)||s.deepSet(l,m,r,i))})),l},e.serializeJSON={defaultOptions:{checkboxUncheckedValue:void 0,parseNumbers:!1,parseBooleans:!1,parseNulls:!1,parseAll:!1,parseWithFunction:null,skipFalsyValuesForTypes:[],skipFalsyValuesForFields:[],customTypes:{},defaultTypes:{string:function(e){return String(e)},number:function(e){return Number(e)},boolean:function(e){return-1===["false","null","undefined","","0"].indexOf(e)},null:function(e){return-1===["false","null","undefined","","0"].indexOf(e)?e:null},array:function(e){return JSON.parse(e)},object:function(e){return JSON.parse(e)},auto:function(n){return e.serializeJSON.parseValue(n,null,null,{parseNumbers:!0,parseBooleans:!0,parseNulls:!0})},skip:null},useIntKeysAsArrayIndex:!1},setupOpts:function(n){var s,t,i,a,l,o;for(s in o=e.serializeJSON,null==n&&(n={}),i=o.defaultOptions||{},t=["checkboxUncheckedValue","parseNumbers","parseBooleans","parseNulls","parseAll","parseWithFunction","skipFalsyValuesForTypes","skipFalsyValuesForFields","customTypes","defaultTypes","useIntKeysAsArrayIndex"],n)if(-1===t.indexOf(s))throw new Error("serializeJSON ERROR: invalid option '"+s+"'. Please use one of "+t.join(", "));return l=(a=function(e){return!1!==n[e]&&""!==n[e]&&(n[e]||i[e])})("parseAll"),{checkboxUncheckedValue:a("checkboxUncheckedValue"),parseNumbers:l||a("parseNumbers"),parseBooleans:l||a("parseBooleans"),parseNulls:l||a("parseNulls"),parseWithFunction:a("parseWithFunction"),skipFalsyValuesForTypes:a("skipFalsyValuesForTypes"),skipFalsyValuesForFields:a("skipFalsyValuesForFields"),typeFunctions:e.extend({},a("defaultTypes"),a("customTypes")),useIntKeysAsArrayIndex:a("useIntKeysAsArrayIndex")}},parseValue:function(n,s,t,i){var a,l;return a=e.serializeJSON,l=n,i.typeFunctions&&t&&i.typeFunctions[t]?l=i.typeFunctions[t](n):i.parseNumbers&&a.isNumeric(n)?l=Number(n):!i.parseBooleans||"true"!==n&&"false"!==n?i.parseNulls&&"null"==n?l=null:i.typeFunctions&&i.typeFunctions.string&&(l=i.typeFunctions.string(n)):l="true"===n,i.parseWithFunction&&!t&&(l=i.parseWithFunction(l,s)),l},isObject:function(e){return e===Object(e)},isUndefined:function(e){return void 0===e},isValidArrayIndex:function(e){return/^[0-9]+$/.test(String(e))},isNumeric:function(e){return e-parseFloat(e)>=0},optionKeys:function(e){if(Object.keys)return Object.keys(e);var n,s=[];for(n in e)s.push(n);return s},readCheckboxUncheckedValues:function(n,s,t){var i,a,l;null==s&&(s={}),e.serializeJSON,i="input[type=checkbox][name]:not(:checked):not([disabled])",t.find(i).add(t.filter(i)).each((function(t,i){if(a=e(i),null==(l=a.attr("data-unchecked-value"))&&(l=s.checkboxUncheckedValue),null!=l){if(i.name&&-1!==i.name.indexOf("[]["))throw new Error("serializeJSON ERROR: checkbox unchecked values are not supported on nested arrays of objects like '"+i.name+"'. See https://github.com/marioizquierdo/jquery.serializeJSON/issues/67");n.push({name:i.name,value:l})}}))},extractTypeAndNameWithNoType:function(e){var n;return(n=e.match(/(.*):([^:]+)$/))?{nameWithNoType:n[1],type:n[2]}:{nameWithNoType:e,type:null}},shouldSkipFalsy:function(n,s,t,i,a){var l=e.serializeJSON.attrFromInputWithName(n,s,"data-skip-falsy");if(null!=l)return"false"!==l;var o=a.skipFalsyValuesForFields;if(o&&(-1!==o.indexOf(t)||-1!==o.indexOf(s)))return!0;var c=a.skipFalsyValuesForTypes;return null==i&&(i="string"),!(!c||-1===c.indexOf(i))},attrFromInputWithName:function(e,n,s){var t;return t='[name="'+n.replace(/(:|\.|\[|\]|\s)/g,"\\$1")+'"]',e.find(t).add(e.filter(t)).attr(s)},validateType:function(n,s,t){var i,a;if(i=(a=e.serializeJSON).optionKeys(t?t.typeFunctions:a.defaultOptions.defaultTypes),s&&-1===i.indexOf(s))throw new Error("serializeJSON ERROR: Invalid type "+s+" found in input name '"+n+"', please use one of "+i.join(", "));return!0},splitInputNameIntoKeysArray:function(n){var s;return e.serializeJSON,s=n.split("["),""===(s=e.map(s,(function(e){return e.replace(/\]/g,"")})))[0]&&s.shift(),s},deepSet:function(n,s,t,i){var a,l,o,c,r,d;if(null==i&&(i={}),(d=e.serializeJSON).isUndefined(n))throw new Error("ArgumentError: param 'o' expected to be an object or array, found undefined");if(!s||0===s.length)throw new Error("ArgumentError: param 'keys' expected to be an array with least one element");a=s[0],1===s.length?""===a?n.push(t):n[a]=t:(l=s[1],""===a&&(r=n[c=n.length-1],a=d.isObject(r)&&(d.isUndefined(r[l])||s.length>2)?c:c+1),""===l||i.useIntKeysAsArrayIndex&&d.isValidArrayIndex(l)?!d.isUndefined(n[a])&&e.isArray(n[a])||(n[a]=[]):!d.isUndefined(n[a])&&d.isObject(n[a])||(n[a]={}),o=s.slice(1),d.deepSet(n[a],o,t,i))}}})?t.apply(n,i):t)||(e.exports=a)},220:function(e,n,s){const t=s(5),i=t.Model.extend({idAttribute:"id",defaults:function(){return{id:void 0,created_on:null,modified_on:null,name:"",items:[],clients:[],owner:null}}});e.exports={Model:i,Collection:t.Collection.extend({model:i})}},271:function(module,exports,__webpack_require__){(function(_){module.exports=function(obj){obj||(obj={});var __t,__p="",__e=_.escape;with(obj)__p+='<div class="modal-content">\n    <div class="modal-header">\n        <h5 class="modal-title">'+__e(i18n("access-lists","form-title",{id:id}))+'</h5>\n        <button type="button" class="close cancel" aria-label="Close" data-dismiss="modal">&nbsp;</button>\n    </div>\n    <div class="modal-body has-tabs">\n        <form>\n            <ul class="nav nav-tabs" role="tablist">\n                <li role="presentation" class="nav-item"><a href="#details" aria-controls="tab1" role="tab" data-toggle="tab" class="nav-link active show" aria-selected="true"><i class="fe fe-zap"></i> '+__e(i18n("access-lists","details"))+'</a></li>\n                <li role="presentation" class="nav-item"><a href="#auth" aria-controls="tab4" role="tab" data-toggle="tab" class="nav-link" aria-selected="false"><i class="fe fe-users"></i> '+__e(i18n("access-lists","authorization"))+'</a></li>\n                <li role="presentation" class="nav-item"><a href="#access" aria-controls="tab2" role="tab" data-toggle="tab" class="nav-link" aria-selected="false"><i class="fe fe-radio"></i> '+__e(i18n("access-lists","access"))+'</a></li>\n            </ul>\n\n            <div class="tab-content">\n                \x3c!-- Details --\x3e\n                <div role="tabpanel" class="tab-pane active show" id="details">\n                    <div class="row">\n                        <div class="col-sm-12 col-md-12">\n                            <div class="form-group">\n                                <label class="form-label">'+__e(i18n("str","name"))+' <span class="form-required">*</span></label>\n                                <input type="text" name="name" class="form-control" value="'+__e(name)+'" required>\n                            </div>\n                        </div>\n\n                        <div class="col-sm-6 col-md-6">\n                            <div class="form-group">\n                                <label class="custom-switch">\n                                    <input type="checkbox" class="custom-switch-input" name="satisfy_any" value="1"'+__e("undefined"!=typeof satisfy_any&&satisfy_any?" checked":"")+'>\n                                    <span class="custom-switch-indicator"></span>\n                                    <span class="custom-switch-description">'+__e(i18n("access-lists","satisfy-any"))+'</span>\n                                </label>\n                            </div>\n                        </div>\n\n                        <div class="col-sm-6 col-md-6">\n                            <div class="form-group">\n                                <label class="custom-switch">\n                                    <input type="checkbox" class="custom-switch-input" name="pass_auth" value="1"'+__e("undefined"!=typeof pass_auth&&pass_auth?" checked":"")+'>\n                                    <span class="custom-switch-indicator"></span>\n                                    <span class="custom-switch-description">'+__e(i18n("access-lists","pass-auth"))+'</span>\n                                </label>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                \x3c!-- Authorization --\x3e\n                <div class="tab-pane" id="auth">\n                    <p>\n                        授权用户基于\n                        <a target="_blank" href="https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html">\n                            Nginx HTTP Basic Authentication\n                        </a>\n                        实现\n                    </p>\n                    <div class="row">\n                        <div class="col-sm-6 col-md-6">\n                            <div class="form-group">\n                                <label class="form-label">'+__e(i18n("str","username"))+'</label>\n                            </div>\n                        </div>\n                        <div class="col-sm-6 col-md-6">\n                            <div class="form-group">\n                                <label class="form-label">'+__e(i18n("str","password"))+'</label>\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class="items">\x3c!-- items --\x3e</div>\n                    <div class="btn-list justify-content-end">\n                        <button type="button" class="btn btn-teal auth_add">'+__e(i18n("access-lists","auth-add"))+'</button>\n                    </div>\n                </div>\n\n                \x3c!-- Access --\x3e\n                <div class="tab-pane" id="access">\n                    <p>\n                        IP地址黑白名单基于\n                        <a target="_blank" href="https://nginx.org/en/docs/http/ngx_http_access_module.html">\n                            Nginx HTTP Access\n                        </a>\n                        实现\n                    </p>\n                    <div class="clients">\x3c!-- clients --\x3e</div>\n                    <div class="row">\n                        <div class="col-sm-3 col-md-3">\n                            <div class="form-group">\n                                <input type="text" class="form-control disabled" value="deny" disabled>\n                            </div>\n                        </div>\n                        <div class="col-sm-9 col-md-9">\n                            <div class="form-group">\n                                <input type="text" class="form-control disabled" value="all" disabled>\n                            </div>\n                        </div>\n                    </div>\n                    <div class="text-muted">注意： <code>allow(允许)</code> 和 <code>deny(禁止)</code> 规则将按照它们定义的顺序执行。</div>\n                    <div class="btn-list justify-content-end">\n                        <button type="button" class="btn btn-teal access_add">'+__e(i18n("access-lists","access-add"))+'</button>\n                    </div>\n                </div>\n\n            </div>\n        </form>\n    </div>\n    <div class="modal-footer">\n        <button type="button" class="btn btn-secondary cancel" data-dismiss="modal">'+__e(i18n("str","cancel"))+'</button>\n        <button type="button" class="btn btn-teal save">'+__e(i18n("str","save"))+"</button>\n    </div>\n</div>\n";return __p}}).call(this,__webpack_require__(3))},272:function(e,n,s){const t=s(6),i=s(273);e.exports=t.View.extend({template:i,className:"row"})},273:function(module,exports,__webpack_require__){(function(_){module.exports=function(obj){obj||(obj={});var __t,__p="",__e=_.escape;with(obj)__p+='<div class="col-sm-6 col-md-6">\n    <div class="form-group">\n        <input type="text" name="username[]" class="form-control" value="'+__e("undefined"!=typeof username?username:"")+'">\n    </div>\n</div>\n<div class="col-sm-6 col-md-6">\n    <div class="form-group">\n        <input type="password" name="password[]" class="form-control" placeholder="'+__e("undefined"!=typeof hint?hint:"")+'" value="">\n    </div>\n</div>\n';return __p}}).call(this,__webpack_require__(3))},274:function(e,n,s){const t=s(6),i=s(275);e.exports=t.View.extend({template:i,className:"row"})},275:function(module,exports,__webpack_require__){(function(_){module.exports=function(obj){obj||(obj={});var __t,__p="",__e=_.escape;with(obj)__p+='<div class="col-sm-3 col-md-3">\n    <div class="form-group">\n        <select name="directive[]" class="form-control custom-select" placeholder="http">\n            <option value="allow" '+__e("undefined"==typeof directive||"allow"===directive?"selected":"")+'>allow</option>\n            <option value="deny" '+__e("undefined"!=typeof directive&&"deny"===directive?"selected":"")+'>deny</option>\n        </select>\n    </div>\n</div>\n<div class="col-sm-9 col-md-9">\n    <div class="form-group">\n        <input type="text" name="address[]" placeholder="IP / Subnet" class="form-control" value="'+__e("undefined"!=typeof address?address:"")+'" value="">\n    </div>\n</div>\n';return __p}}).call(this,__webpack_require__(3))}}]);