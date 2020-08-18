```
Object.defineProperty(obj,'属性',配置对象) 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回此对象。
```

```
Object.keys(obj) 方法会返回一个由一个给定对象的自身可枚举属性组成的数组
```

```
Object.create(obj) 返回一个新的对象,该对象的__proto__是传入的obj
```

```
Object.getOwnPropertySymbols(obj) 方法返回一个给定对象自身的所有 Symbol 属性的数组。
```

```
Object.getOwnPropertyNames(obj) 方法返回一个由指定对象的所有自身属性的属性名（包括不可枚举属性但不包括Symbol值作为名称的属性）组成的数组。

```

以下node就是元素(element)

```
node.nodeType 判断节点类型

如果节点是元素节点，则 nodeType 属性将返回 1。

如果节点是属性节点，则 nodeType 属性将返回 2。
```

```
node.childNodes() 获取到节点下的所有子节点
```

```
node.appendChild() 将一个节点附加到指定父节点的子节点列表的末尾处。
```

```
node.attributes() 获取到元素上的属性节点
```

```
node.textContent=''  textContent可以获取或者设置元素的文字内容
```

```
startsWith('Hello')   查看字符串是否为 "Hello" 开头:
```

```
node.innerHTML='<div>html</div>' 设置 innerHTML 的值可以让你轻松地将当前元素的内容替换为新的内容。
```

```
node.removeAttributeNode() 删除元素上指定属性
```



```js
Symbol:
基本数据类型
symbol值能作为对象属性的标识符
Symbol()函数会返回symbol类型的值，此值是唯一的
代码如下:
// 创建Symbol值
	let id=Symbol('id')
	let id1=Symbol('id')
	let id2=Symbol('id')
    // 对比Symbol值
    console.log(id==id1) //false 因为返回的Symbol值都是唯一的
	var obj={
		id:'symbol'
	}
    // 添加Symbol值为对象的属性
	obj[id]='symbol'
	obj[id1]='symbol'
	obj[id2]='symbol'
	// 打印对象
	console.log(obj)
	// 打印对象返回的数组(不包含Symbol属性)
	console.log(Object.getOwnPropertyNames(obj))
	// 打印对象返回的数组(只包含Symbol属性)
	console.log(Object.getOwnPropertySymbols(obj))
```

```js
for...of... 和for...in...

for...of...只会遍历可迭代的数据结构: Arrays（数组）, Strings（字符串）, Maps（映射）, Sets（集合）而Object不是可迭代的数据结构,所以不能遍历,那么怎么定义不是可迭代的数据结构呢?如下:
(ES6 中引入了 Iterator，只有提供了 Iterator 接口的数据类型才可以使用 for-of 来循环遍历，而 Array、Set、Map、某些类数组如 arguments 等数据类型都默认提供了 Iterator 接口，所以它们可以使用 for-of 来进行遍历)

能不能为对象以及其它的一些数据类型提供 Iterator 接口呢?如下:
答案是可以的，ES6 同时提供了 Symbol.iterator 属性，只要一个数据结构有这个属性，就会被视为有 Iterator 接口，
```

**function\***

```
function* 这种声明方式(function关键字后跟一个星号）会定义一个生成器函数 (generator function)，它返回一个  Generator  对象(生成器对象)。
```

**生成器对象**

```
生成器对象是由一个 generator function 返回的,并且它符合可迭代协议和迭代器协议。
```

**yield和next()**

```
yield类似于return 都是为函数返回值,但是return在函数中即便使用多次只能返回第一个return的值,而yield使用多个,则可以通过next()依次得到返回的值
```

### **1. vue是怎么实现对数据的检测(数据可观测)**

#### observe

#### defineReactive

```js
通过observe类和defineReactive函数对data中的数据进行递归深度遍历

observe类: 主要是遍历出对象所有的key传给defineReactive函数
defineReactive函数: 则通过Object.defineProperty的get和set方法,用于监听每一个属性的读取和修改,如果某一个属性所对应的属性值是对象,那么重新调用observe类再次遍历,以此类推实现数据的深度监听

代码实例:
<script>
    class Observer {
      constructor (value) {
        this.value = value
        if (Array.isArray(value)) {
          // 当value为数组时的逻辑
          // ...
        } else {
          this.walk(value)
        }
      }

      walk (obj) {
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
          defineReactive(obj, keys[i])
        }
      }
    }
    /**
     * 使一个对象转化成可观测对象
     * @param { Object } obj 对象
     * @param { String } key 对象的key
     * @param { Any } val 对象的某个key的值
     */
    function defineReactive (obj,key,val) {
      // 如果只传了obj和key，那么val = obj[key]
      if (arguments.length === 2) {
        val = obj[key]
      }
      if(typeof val === 'object'){
          new Observer(val)
      }
      Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get(){
          console.log(`${key}属性被读取了`);
          return val;
        },
        set(newVal){
          if(val === newVal){
              return
          }
          console.log(`${key}属性被修改了`);
          val = newVal;
        }
      })
    }
    var obj1={
        'haha':{
            haha1:'haha1',
            haha2:'haha2',
        },
        'hehe':'hehe',
        'houhou':'houhou'
    }
    new Observer(obj1)
    obj1.hehe='hehe1'
</script>
```

### **2. vue检测数据变化后是通过什么方式通知视图更新的,怎么定义依赖,怎么收集依赖?**

#### dep

```js
视图里谁用到了这个数据就更新谁，我们换个优雅说法：我们把"谁用到了这个数据"称为"谁依赖了这个数据",我们给每个数据都建一个依赖数组

通过dep类,给每一个数据绑定一个dep实例，而dep实例中有一个收集依赖的数组,只要是依赖该数据都会添加到依赖数组中。我们在get中调用了dep.depend()方法收集依赖，在set中调用dep.notify()方法通知所有依赖更新,而更新的函数是update()。
代码：
function defineReactive (obj,key,val) {
  if (arguments.length === 2) {
    val = obj[key]
  }
  if(typeof val === 'object'){
    new Observer(val)
  }
  const dep = new Dep()  //实例化一个依赖管理器，生成一个依赖管理数组dep
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get(){
      dep.depend()    // 在getter中收集依赖
      return val;
    },
    set(newVal){
      if(val === newVal){
          return
      }
      val = newVal;
      dep.notify()   // 在setter中通知依赖更新
    }
  })
}


export default class Dep {
  constructor () {
    this.subs = []
  }

  addSub (sub) {
    this.subs.push(sub)
  }
  // 删除一个依赖
  removeSub (sub) {
    remove(this.subs, sub)
  }
  // 添加一个依赖
  depend () {
    if (window.target) {
      this.addSub(window.target)
    }
  }
  // 通知所有依赖更新
  notify () {
    const subs = this.subs.slice()
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

/**
 * Remove an item from an array
 */
export function remove (arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
```

### **3. 到底什么是依赖**

#### Watcher

```js
虽然我们一直在说”谁用到了这个数据谁就是依赖“，但是这仅仅是在口语层面上，那么反应在代码上该如何来描述这个”谁“呢？

Watcher类: 其实在Vue中还实现了一个叫做Watcher的类，而Watcher类的实例就是我们上面所说的那个"谁"。换句话说就是：谁用到了数据，谁就是依赖，我们就为谁创建一个Watcher实例。在之后数据变化时，我们不直接去通知依赖更新，而是通知依赖对应的Watch实例，由Watcher实例去通知真正的视图。
```

