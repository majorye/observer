/**
* MVVM pattern to do the front-end development
*/
(function(window){
var ob = window["ob"] = {};
ob.constant={
  dataclass:['data-binding'],
  events:['click','change']
}
/**
* viewModel {JSON} this object will present the related UI component , 
*                   including the attribute, data , and operation
* rootNode  {Element} default is the document.
* currently , it will search the "data-binding:text/value" etc
*/
ob.applyBindings=function (viewModel, rootNode) {
  if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
			throw new Error("observer.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
	applyBindingsToNodeAndDescendantsInternal(viewModel,rootNode);
};
function applyBindingsToNodeAndDescendantsInternal(viewModel, rootNode){
  rootNode=rootNode?rootNode:document.body;
  var childs=rootNode.children;
  var isElement = (rootNode.nodeType == 1);
  var nodeHasBinding=ob.bindingProvider.nodeHasBindings(rootNode);
  if(isElement && nodeHasBinding){
    applyBindingsToNode(viewModel,rootNode);
  }
  ob.util.arrayForEach(childs,function(e){
    applyBindingsToNodeAndDescendantsInternal(viewModel,e);
  });
}
//current just support single data-bindings
function applyBindingsToNode(viewModel,node){
  var bindings=ob.bindingProvider.getBindings(node);
  for(var prop in bindings) {
    if(bindings.hasOwnProperty(prop) && prop=="data-binding") {
	  ob.util.arrayForEach(bindings["data-binding"],function(e){
	    ob.bindingProvider.syncDataBinding(viewModel,node,e);
	  });
	}
  }
}

/**
* Simple Binding Provider, to check whether the element have the binding property, if have , register the binding relationship
*/
ob.bindingProvider={
  nodeHasBindings:function(node){
	  /*ob.util.arrayForEach(ob.constant.dataclass,function(e){
		  var attribute= node.getAttribute ? node.getAttribute(e) : false;
		  console.log(attribute);
		  return 
	  });*/
	  for(var i=0;i<ob.constant.dataclass.length;i++){
	    var attribute= node.getAttribute ? node.getAttribute(ob.constant.dataclass[i]) : false;
		return attribute;
	  }
	 },
  getBindings:function(node){
	  var bindingObj={};
	  ob.util.arrayForEach(ob.constant.dataclass,function(e){
	  var attributes=node.getAttribute(e);
	  if(attributes){
	   attributes = attributes.split(' ');
	   var arr=[];
	   for(var i=0;i<attributes.length;i++){
		 arr.push(attributes[i]);
	   }
	   bindingObj[e]=arr;
	  }
	})
	  return bindingObj;
  },
  syncDataBinding:function(viewModel,node,binding){
    var type=binding.split(":")[0],
	attr=binding.split(":")[1];
	//var attrObj=ob.bindingProvider.registerDependance(viewModel,node,attr);
	switch(type){
	  case "text":
	    node.innerHTML="<text>"+viewModel[attr]+"</text>";
		break;
	  case "value":
	    node.value=viewModel[attr];
		//ob.util.registerEventHandler(node,"blur",attrObj.notifySubscribers);
		break;
	  default:
	    if(ob.util.arrayIndexOf(ob.constant.events,type)!=-1){
		  ob.util.registerEventHandler(node,type,viewModel[attr]);
		}
	    break;
	}
  }
  /*registerDependance=function(viewModel,node,attr){
    var attrobj=new ob.attrObj();
	attrobj.init(attr,viewModel,node);
	return attrobj;
	
  },
  updateDataBinding:function(viewModel,node,attr){
    var bindings=ob.bindingProvider.getBindings(node);
	for(var prop in bindings) {
    if(bindings.hasOwnProperty(prop) && prop=="data-binding") {
	  ob.util.arrayForEach(bindings["data-binding"],function(e){
	    if(e.indexof(attr) !=-1){
		  var type=e.split(":")[0],
	      attr=e.split(":")[1];
		  	switch(type){
			  case "text":
				node.innerHTML="<text>"+viewModel[attr]+"</text>";
				break;
			  case "value":
				node.value=viewModel[attr];
				break;
			  default:
				break;
			}
		}
	  });
	}
   }
  }*/
}

/**
* attribute instance factory, suppose attribue is AAA, so this 
* instance should have getAAA, setAAA, subscribersMap, notifySubscribers method

ob.attrObj=function(){}
var _attrObjProto=ob.attrObj.prototype;
_attrObjProto.init=function(attr,viewModel,node){
  this.attr=attr;
  this.viewModel=viewModel;
  this.viewModel.get[this.attr]=function(){
    return this.viewModel[attr];
  };
  this.viewModel.get[this.attr+"Obj"]=function(){
    return this;
  }
  this.viewModel.set[this.attr]=function(value){
    this.viewModel[attr]=value;
	this.notifySubscribers();
  }
  if(!this.subscribersMap)
    this.subscribersMap=[];
  this.subscribersMap.push(node);
}
_attrObjProto.notifySubscribers=function(){
  for(var i=0;i<this.subscribersMap.length;i++){//update
    ob.bindingProvider.updateDataBinding(this.viewModel,this.subscribersMap[i],thia.attr);
  }
}

/**
* util method
*/
ob.util={
	extend: function (target, source) {
		for(var prop in source) {
			if(source.hasOwnProperty(prop)) {//will not check the prototype chain prop
				target[prop] = source[prop];
			}
		}
		return target;
	},
	arrayForEach: function (array, action) {
	for (var i = 0, j = array.length; i < j; i++)
		action(array[i]);
	},
	arrayIndexOf: function (array, item) {
		if (typeof Array.prototype.indexOf == "function")
			return Array.prototype.indexOf.call(array, item);
		for (var i = 0, j = array.length; i < j; i++)
			if (array[i] === item)
				return i;
		return -1;
	},
	 registerEventHandler: function (element, eventType, handler) {
           if (typeof element.addEventListener == "function")
                element.addEventListener(eventType, handler, false);
            else if (typeof element.attachEvent != "undefined")
                element.attachEvent("on" + eventType, function (event) {
                    handler.call(element, event);
                });
            else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },
        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            if (typeof jQuery != "undefined") {
                var eventData = [];
                if (isClickOnCheckableElement(element, eventType)) {
                    // Work around the jQuery "click events on checkboxes" issue described above by storing the original checked state before triggering the handler
                    eventData.push({ checkedStateBeforeEvent: element.checked });
                }
                jQuery(element)['trigger'](eventType, eventData);
            } else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            } else if (typeof element.fireEvent != "undefined") {
                // Unlike other browsers, IE doesn't change the checked state of checkboxes/radiobuttons when you trigger their "click" event
                // so to make it consistent, we'll do it manually here
                if (eventType == "click") {
                    if ((element.tagName == "INPUT") && ((element.type.toLowerCase() == "checkbox") || (element.type.toLowerCase() == "radio")))
                        element.checked = element.checked !== true;
                }
                element.fireEvent("on" + eventType);
            }
            else
                throw new Error("Browser doesn't support triggering events");
        }
};
})(window);

