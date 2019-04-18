import $ from 'jquery';
class Unit{
    constructor(element){
        this._currentElement = element;
    }
}
class ReactTextUnit extends Unit{
    getMarkup(rootId){
       this._rootId = rootId;
       return `<span data-reactid="${rootId}">${this._currentElement}</span>`;
    }
    update(nextElement){
        console.log(nextElement);
        if(this._currentElement !== nextElement){
            this._currentElement = nextElement;
            $(`[data-reactid="${this._rootId}"]`).html(this._currentElement);
        }
    }
}
class ReactNativeUnit extends Unit{
    getMarkup(rootId){
        this._rootId = rootId;
        let {type,props} = this._currentElement;
        let tagStart = `<${type} data-reactid="${rootId}" `;
        let childString = '';
        let tagEnd = `</${type}>`;
        let renderedUnitChildren = [];
        for(let propKey in props){
            if(/^on[A-Z]/.test(propKey)){//如果匹配说明要绑定事件
                let eventType = propKey.slice(2).toLowerCase();//event.0
                $(document).delegate(`[data-reactid="${rootId}"]`,`${eventType}.${rootId}`,props[propKey]);
            }else if(propKey === 'children'){
                let children = props.children ||[];
                childString = children.map((child,index)=>{
                    let childReactUnit = createReactUnit(child);
                    renderedUnitChildren.push(childReactUnit);
                    let childMarkup = childReactUnit.getMarkup(`${rootId}.${index}`);
                    return childMarkup;
                }).join('');
            }else{
                tagStart += (' '+propKey+'='+props[propKey]);
            }
        }
        this.renderedUnitChildren = renderedUnitChildren;
        return tagStart+'>'+childString+tagEnd;
        //<button id="sayHello">say<b>Hello</b></button>
        //<button id="sayHello">say<b>Hello</b></button>
        //return '<button id="sayHello">say<b>Hello</b></button>';
    }
    update(nextElement){
        this._currentElement = nextElement;
        //获取旧的属性对象
        let oldProps = this._currentElement.props;
        //获取新的属性对象
        let newProps = nextElement.props;
        console.log(this._currentElement);
        //修改属性对象
        this.updateProperties(oldProps,newProps);
        //更新子元素
        this.updateChildren(newProps.children);
    }
    //更新子元素 参数是新的儿子节点
    updateChildren(newChildrenElements){
        this.diff(newChildrenElements);
    }
    //进行DOMDIFF进行比较
    diff(newChildrenElements){
        //为了判断新的元素在旧的元素里有没有
        let oldChildrenMap = this.getChildrenMap(this.renderedUnitChildren);
        this.getNewChildren(oldChildrenMap,newChildrenElements);
    }
    //这个方法的作用是获取新的虚拟DOM元素 还会直接修改匹配的属性
    getNewChildren(oldChildrenMap,newChildrenElements){
        let newChildren = [];
        newChildrenElements.forEach((newElement,idx)=>{
            let newKey = (newElement.props&&newElement.props.key)||idx.toString();
            //通过key找到旧的unit
            let oldChild = oldChildrenMap[newKey];
            let oldElement = oldChild&&oldChild._currentElement;
            //比较新旧的元素是否一样，如果是一样的，可以进行深度比较
            if(shouldDeepCompare(oldElement,newElement)){
                oldChild.update(newElement);
                //如果当前的key在老的集合里有，则可以复用旧的unit
                newChildren[idx] = oldChild;
            }else{//不需要深度比较,直接 创建新的unit进行赋值
                let newChildInstance = createReactUnit(newElement);
                newChildren[idx] = newChildInstance;
            }
        });
        return newChildren;
    }
    getChildrenMap(children){
        let childrenMap = {};
        for(let i=0;i<children.length;i++){
            //如果说元素给了key了就用元素的key,如果没有给key 则用前子元素的索引当成key
            let key = (children[i]._currentElement.props&&children[i]._currentElement.props.key) || i.toString();
            childrenMap[key] = children[i];
        }
        return childrenMap;
    }
    //执行这个方法的时候，属性是直接操作DOM修改掉了
    updateProperties(oldProps,newProps){
        let propKey;
        for(propKey in oldProps){
            //如果此老属性在新的属性对象中没有，或者说不存在
            if(!newProps.hasOwnProperty(propKey)){
                $(`[data-reactid="${this._rootId}"]`).removeAttr(propKey);
            }
            if(/^on[A-Z]/.test(propKey)){
                $(document).undelegate('.'+this._rootId);
            }
        }
        for(propKey in newProps){
            if(propKey == 'children') continue;
            //重新绑定事件 
            if(/^on[A-Z]/.test(propKey)){
                let eventType = propKey.slice(2).toLowerCase();//event.0
                $(document).delegate(`[data-reactid="${this._rootId}"]`,`${eventType}.${this._rootId}`,newProps[propKey]);
                continue;
            }
            //更新新的属性
            $(`[data-reactid="${this._rootId}"]`).prop(propKey,newProps[propKey]);
        }
    }
}
class ReactCompositeUnit extends Unit{
    //自定义组件渲染的内容是由什么决定的？render方法的返回值决定的，render方法的返回值是
    //一个虚拟DOM,Element的实例 ,但是最终肯定是落实到Native或Text上
    getMarkup(rootId){
        this._rootId = rootId;
        //通过_currentElement获得Counter组件
        let {type:Component,props} = this._currentElement;//{type:Counter, props:{name:'我的计数器'})
        //先创建Counter组件的实例
        let componentInstance = this._componentInstance = new Component(props);
        //请此组件的实例的unit属性指向自己这个unit
        this._componentInstance.unit = this;
        //如果有组件将要挂载函数，就执行它
        componentInstance.componentWillMount&&componentInstance.componentWillMount();
        //调用render方法得到返回的虚拟DOM ，也就是React元素
        let renderedElement = componentInstance.render();
        //获取要渲染的单元实例并且存放到当前unit的_renderedUnitInstance属性上
        let renderedUnitInstance = this._renderedUnitInstance =  createReactUnit(renderedElement);
        //获取对应的HTML字符串
        let renderedMarkup = renderedUnitInstance.getMarkup(rootId);
        $(document).on('mounted',()=>{
            componentInstance.componentDidMount&&componentInstance.componentDidMount()
        });
        return renderedMarkup;
    }
    //更新有两种可能
    update(nextElement,partialState){
        //确定新的元素 {type:Counter,props:{}} 
        this._currentElement = nextElement||this._currentElement;
        //用老状态和新状态进行合并得到最终状态并赋给Counter组件
        let nextState = this._componentInstance.state = Object.assign(this._componentInstance.state,partialState);
        let nextProps = this._currentElement.props;//新的属性对象
        if(this._componentInstance.shouldComponentUpdate&&!this._componentInstance.shouldComponentUpdate(nextProps,nextState)){
            return;//如果有此方法，并且是否要更新的方法返回了false,那么到此结束了
        }
        //执行组件将要更新的生命周期函数
        this._componentInstance.componentWillUpdate&&this._componentInstance.componentWillUpdate();
        //可以通过老的render出来的unit获得老的元素
        let preRenderedUnitInstance =this._renderedUnitInstance;
        let preRenderedElement= preRenderedUnitInstance._currentElement;
        //因为属性的状态都已经更新过了，
        let nextRenderElement = this._componentInstance.render();
        if(shouldDeepCompare(preRenderedElement,nextRenderElement)){
            //composite真正的深比较，不是自己干 活，而是交给
            preRenderedUnitInstance.update(nextRenderElement);
            this._componentInstance.componentDidUpdate&&this._componentInstance.componentDidUpdate();
        }else{//如果不需要深度比较，直接 删除老的重建新的
            //根据新的React元素创建新的Instance实例并且直接重建新的节点
            this._renderedUnitInstance = createReactUnit(nextRenderElement);
            let nextMarkUp = this._renderedUnitInstance.getMarkup();
            $(`[data-reactid="${this._rootId}"]`).replaceWith(nextMarkUp);
        }
    }
}
//是否继续深度往下比较的意思
function shouldDeepCompare(oldElement,newElement){
  if(oldElement !=null && newElement != null){
    let oldType = typeof oldElement;
    let newType = typeof newElement;
    //如果老的元素是一个数字或者是一个字符串的话
    if(oldType === 'string' || oldType === 'number'){
        return newType === 'string'|| newType === 'number';
    }else{//如果说不是字符串或数字的话 div div
        return newType == 'object' && oldElement.type === newElement.type;
    }
  }else{
      //如果任何一方为NULL，不用进行深度domdiff对比了
      return false;
  }
}
//它是一个工厂方法，根据参数的参数生产不同的类型的实例，但一般来说这些实例都是同一个父类的子类
function createReactUnit(element){
    if(typeof element =='number' || typeof element == 'string'){
        return new ReactTextUnit(element);
    }
    // {type:'button',props:{}} 说明它是一个原生的DOM节点
    if(typeof element == 'object' &&  typeof element.type == 'string'){
        return new ReactNativeUnit(element);
    }
    if(typeof element == 'object' &&  typeof element.type == 'function'){
        return new ReactCompositeUnit(element);
    }

}
export default createReactUnit;