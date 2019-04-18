import $ from 'jquery';
import createReactUnit from './unit';
import createElement from './element';
import Component from './component';
let React = {
    nextRootIndex:0,//下一个的根节点索引号
    render,
    createElement,
    Component
}
function render(element,container){
    //container.innerHTML = `<span data-reactid="${React.nextRootIndex}">${element}</span>`;
    //为了以后扩展的方便，我定义了一个工厂方法，只要传入element,里面就可以返回正确的实例
    //createReactUnit 实例化组件
    let unitInstance = createReactUnit(element);
    //通过实例 获取此实例对应的HTML片断
    let markup = unitInstance.getMarkup(React.nextRootIndex);
    //放到容器中去
    $(container).html(markup);
    //触发了一个自定义的事件mounted,因为在getMarkUp方法里不同的组件都会监听mounted事件
    $(document).trigger('mounted');
}
export default React;