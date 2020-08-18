const compileUtil = {
  getVal(expr, vm) {
    // 如果取值是通过 v-text='person.name' 的方式,就要通过数组的reduce()方法去获取到person下name的值
    // data的初始值是传进去的vm.$data,currentVal是expr数组中的值(依次填充),return的值会重新赋给data,直至expr数组遍历完
    return expr.split(".").reduce((data, currentVal) => {
      return data[currentVal];
    }, vm.$data);
  },
  setVal(expr, vm, inputVal) {
    expr.split(".").reduce((data, currentVal) => {
      // 当data中的数据改变时会通知数据对用的dep下的所有的watcher去更新页面
      data[currentVal] = inputVal;
    }, vm.$data);
  },
  getContentVal(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm);
    });
  },
  text(node, expr, vm) {
    let value;
    if (expr.indexOf("{{") !== -1) {
      // // 处理双大括号的
      // {{person.name}}--{{person.age }}
      // g代表全局匹配,函数中会传进四个参数,分别是：匹配到的内容,替换后的内容,从哪个下标匹配到的,匹配前全部的内容
      // 利用三点运算符的剩余参数,把所有的参数转换到数组里,直接拿到数组中的而第二个参数就是替换后的内容
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        new Watcher(vm, args[1], (newVal) => {
          this.updeter.textUpdater(node, this.getContentVal(expr, vm));
        });
        return this.getVal(args[1], vm);
      });
    } else {
      value = this.getVal(expr, vm);
      // 数据初始渲染到页面时,给每一个需要数据的节点绑上watcher(数据驱动视图)
      // 一个数据对应多个watcher,watcher在Object.defineProperty的get方法中存入对应数据的dep的subs数组中
      new Watcher(vm, expr, (newVal) => {
        this.updeter.textUpdater(node, newVal);
      });
    }
    // 找到对应的data中的内容,更新到页面上
    this.updeter.textUpdater(node, value);
  },
  html(node, expr, vm) {
    const value = this.getVal(expr, vm);
    new Watcher(vm, expr, (newVal) => {
      this.updeter.htmlUpdater(node, newVal);
    });
    this.updeter.htmlUpdater(node, value);
  },
  model(node, expr, vm) {
    const value = this.getVal(expr, vm);
    new Watcher(vm, expr, (newVal) => {
      this.updeter.modelUpdater(node, newVal);
    });
    // 视图驱动数据(双向数据绑定)
    node.addEventListener("input", (e) => {
      console.log(e);
      this.setVal(expr, vm, e.target.value);
    });
    this.updeter.modelUpdater(node, value);
  },
  on(node, expr, vm, eventName) {
    let fn = vm.$options.methods && vm.$options.methods[expr];
    // bind返回的是一个新的函数，你必须调用它才会被执行。而call和apply是直接调用函数。
    node.addEventListener(eventName, fn.bind(vm), false);
  },
  bind(node, expr, vm, attrName) {
    const value = this.getVal(expr, vm);
    this.updeter.srcUpdater(node, value);
  },
  updeter: {
    modelUpdater(node, value) {
      node.value = value;
    },
    textUpdater(node, value) {
      node.textContent = value;
    },
    htmlUpdater(node, value) {
      node.innerHTML = value;
    },
    srcUpdater(node, value) {
      node.src = value;
    },
  },
};

class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    // 1.获取文档碎片对象,放入内存中会减少页面的回流和重绘(也就是说将根节点中的所有节点传给文档碎片对象,所有的操作在文档碎片中操作完后再真正的去改变真实dom对象,减少回流和重绘)
    const fragment = this.node2Fragment(this.el);
    // 2. 编译fragment
    this.compile(fragment);
    // 3. 再讲文档碎片对象中的节点归还给根节点,中间相当于被文档碎片插了一脚
    this.el.appendChild(fragment);
  }

  compile(fragment) {
    //1. 获取子节点
    const childNodes = fragment.childNodes;
    [...childNodes].forEach((child) => {
      if (this.isElementNode(child)) {
        // 是元素节点
        // 编译元素节点
        this.compileElement(child);
      } else {
        // 文本节点
        // 编译文本节点
        this.compileText(child);
      }
      // 对节点进行递归深度遍历
      if (child.childNodes && child.childNodes.length) {
        this.compile(child);
      }
    });
  }

  compileElement(node) {
    const attributes = node.attributes;
    [...attributes].forEach((attr) => {
      // console.log(attr.name, attr.value);
      const { name, value } = attr;
      if (this.isDirective(name)) {
        //判断是否是vue指令 v-text v-html v-model v-on:click v-bind:src
        const [, directive] = name.split("-"); //text html model on:click bind:src
        const [dirName, eventName] = directive.split(":"); //text html model on bind
        // 数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName); // 触发的是什么指令,调用该指令的方法,并传过去(对应节点、对应的data中的值、Mvue实例、事件名)

        // 删除所有标签上的指令属性
        node.removeAttribute("v-" + directive);
      } else if (this.isEventName(name)) {
        // 判断是否是以@开头的事件,@click='handler'
        const [, eventName] = name.split("@");
        compileUtil["on"](node, value, this.vm, eventName);
        node.removeAttribute("@" + eventName);
      } else if (this.isColonName(name)) {
        // 判断是否是以:开头的事件,:src=''
        const [, colonName] = name.split(":");
        compileUtil["bind"](node, value, this.vm, colonName);
        node.removeAttribute(":" + colonName);
      }
    });
  }
  compileText(node) {
    // 使用正则找到{{}}
    // node.textContent获取和设置元素的文字内容
    const content = node.textContent;
    if (/\{\{(.+?)\}\}/.test(content)) {
      compileUtil["text"](node, content, this.vm);
    }
  }

  isDirective(attrName) {
    return attrName.startsWith("v-");
  }
  isEventName(eventName) {
    return eventName.startsWith("@");
  }
  isColonName(colonName) {
    return colonName.startsWith(":");
  }

  node2Fragment(el) {
    // 创建文档碎片
    const f = document.createDocumentFragment();
    let firstChild;
    while ((firstChild = el.firstChild)) {
      f.appendChild(firstChild);
    }
    return f;
  }

  isElementNode(node) {
    return node.nodeType === 1;
  }
}

class Mvue {
  constructor(options) {
    window.vm = this;
    this.$el = options.el;
    this.$data = options.data;
    this.$options = options;
    if (this.$el) {
      //1. 实现一个数据的观察者
      new Observer(this.$data);
      //2. 实现一个指令的解析器
      new Compile(this.$el, this);
      //3.数据代理
      this.proxyData(this.$data);
    }
  }
  proxyData(data) {
    for (const key in data) {
      Object.defineProperty(this, key, {
        get() {
          return data[key];
        },
        set(newVal) {
          data[key] = newVal;
        },
      });
    }
  }
}
