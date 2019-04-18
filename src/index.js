import React from './react';
class Counter extends React.Component{
    constructor(props){
        super(props);
        this.state = {number:0};
    }
    componentWillMount(){
        console.log('Counter将要挂载');
    }
    componentDidMount(){
     /*    console.log('Counter挂载完成');
        setInterval(()=>{
            this.setState({number:this.state.number+1});
        },1000); */
    }
    shouldComponentUpdate(nextProps,nextState){
        return true;
    }
    handleClick = ()=>{
        this.setState({number:this.state.number+1});
    }
    render(){
       let p = React.createElement('p',{},this.state.number);
       let button = React.createElement('button',{onClick:this.handleClick},'+');
       return React.createElement('div',{id:'counter'},p,button);
    }
}
let element = React.createElement(Counter,{name:'我的计数器'});
React.render(element,document.getElementById('root'));

//节点很多的话，工厂方法里面会一直new 对象这样会有问题不
//React 对象缓存 onclick addEventLister()
/**
class Counter extends React.Component{
    constructor(props){
        super(props);
        this.state = {number:0};
    }
    componentWillMount(){
        console.log('Counter将要挂载');
    }
    componentDidMount(){
        console.log('Counter挂载完成');
    }
    handleClick = ()=>{
        this.setState({number:this.state.number+1});
    }
    render(){
        let p = React.createElement('p',{},this.props.name,this.state.number);
        let button = React.createElement('button',{onClick:this.handleClick},'+');
        //虚拟DOM = 元素的实例
        return React.createElement('div',{id:'counter'},p,button);
        //return React.createElement(Counter);
    }
}
 */