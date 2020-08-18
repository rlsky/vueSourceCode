class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    // 先把旧值保存起来
    this.oldVal = this.getOldVal();
  }
  getOldVal() {
    Dep.target = this;
    const oldVal = compileUtil.getVal(this.expr, this.vm);
    Dep.target = null;
    return oldVal;
  }
  update() {
    const newVal = compileUtil.getVal(this.expr, this.vm);
    if (newVal !== this.oldVal) {
      this.cb(newVal);
    }
  }
}

class Dep {
  constructor() {
    this.subs = [];
  }
  //收集观察者
  addSub(watcher) {
    this.subs.push(watcher);
  }
  //通知观察者去更新
  // set方法监听数据改变,当数据改变时,通知该数据下所有的watcher进行页面更新,通过Watcher的update中的回调函数cb
  nodify() {
    console.log("观察者", this.subs);
    this.subs.forEach((w) => w.update());
  }
}

class Observer {
  constructor(data) {
    this.observer(data);
  }
  observer(data) {
    if (data && typeof data === "object") {
      Object.keys(data).forEach((key) => {
        this.defineRective(data, key, data[key]);
      });
    }
  }
  defineRective(obj, key, value) {
    // 递归遍历
    this.observer(value);
    const dep = new Dep();
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: false,
      get() {
        //订阅数据变化,往dep中添加观察者,每一个属性都对应多个watcher
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      set: (newValue) => {
        this.observer(newValue);
        if (newValue !== value) {
          value = newValue;
        }
        dep.nodify();
      },
    });
  }
}
