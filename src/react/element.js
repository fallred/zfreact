class Element{
    //type Counter props = {name:'我的计数器'}
    constructor(type,props){
        this.type = type;
        this.key = props.key;//dom diff key对比用的
        this.props = props;
    }
}
function createElement(type,props={},...children){
    props = props||{};
    props.children = children;
    //这就是虚拟DOM {type:'button',props:{}}
    return new Element(type,props);
}

export default createElement;