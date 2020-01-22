/**
 * 200122 ||
 */

const type = (target, type)=>{
    if(typeof type == "string"){
        if(typeof target != type) throw `invaild type ${target} : ${type}`;
    }else if(!(target instanceof type)) throw `invaild type ${target} : ${type}`;
    return target;
};


const ViewModelListener = class {

};

/**
 * 인포객체임..
 * 디자인 하기 어려움...
 * 옵저버 패턴에서 이벤트 객체를....
 * 인포객체가 충분해야 원본 을 보지 않을 수 있다.
 *
 * ---> 우리의 이벤트 리스너 핸들링이 지저분한 이유다. event 가 부족하기 때문에...
 *
 * 디자인....을 잘해야 함.
 *
 * @type {ViewModelValue}
 */
const ViewModelValue = class{
    subKey; cat; k; v;
    constructor(subKey, cat, k, v){
        this.subKey = subKey;
        this.cat = cat;
        this.k = k;
        this.v = v;
        //TOOO asdfasdfsdfasdfasdfsdfsdfasdfsdfsdfsdfasdfsadfsdfsdfasdfsdfasdfsdf
        Object.freeze(this);
    }
};

const ViewModel = class extends ViewModelListener{

    /*
    한 프레임에 한 번만 업데이트

     */
    static #subjects = new Set;
    static #inited = false;
    static notify(vm) {
        this.#subjects.add(vm);
        if(this.#inited) return;
        this.#inited = true;
        const f =_=>{
            this.#subjects.forEach(vm=>{
                if(vm.#isUpdated.size) {
                    vm.notify();
                    vm.#isUpdated.clear();
                }
            });
            requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
    }






    static get(data){ return new ViewModel(data);}
    styles={}; attributes={}; properties={}; events={};
    ///// 추가 [s] 프로세서 관련
    #isUpdated = new Set; #listeners = new Set;
    addListener(v, _=type(v, ViewModelListener)){
        this.#listeners.add(v);
    }

    subKey = ""; parent = null;






    // 중복은 발생하는게 아니라 발견되는 것이다.
    __constructor(checker, data) {
        Object.entries(data).forEach(([k, v])=>{
            switch (k) {
                case"styles": this.styles = v; break;
                case"attributes": this.attributes = v; break;
                case"properties": this.properties = v; break;
                case"events": this.events = v; break;
                default: this[k] = v;
            }
        });
        Object.seal(this);
    }

    // 200122 만들기...
    constructor(checker, data) {
        super();
        Object.entries(data).forEach(([k, obj])=>{
            if("styles,attributes,properties,events".includes(k)) {
                this[k] = Object.defineProperties(obj,
                    Object.entries(obj).reduce((r, [k, v])=>{
                        r[k] ={
                            enumerable:true,
                            get:_=>v,
                            set:newV=>{
                                v = newV;
                                this.#isUpdated.add(new ViewModelValue("", k, v));
                            }
                        };
                        return r;
                    }, {}));
            } else {
                Object.defineProperties(this, k, {
                    enumerable:true,
                    get:_=>v,
                    set:newV=>{
                        v = newV;
                        /*
                        내가 부모일 때와 지식일 때를 모두 고려해야 해서 어려워진다....
                         */
                        this.#isUpdated.add(new ViewModelValue(this.subKey, k, v));
                    }
                });
                // 내 자식의 변화도 알려야 하기 때문에 아래 내용이 추가됨.
                if (v instanceof ViewModel) {
                    v.parent = this; // 역참조 (BackBind) 를 위해 걸어줌.
                    v.subKey = k;
                    v.addListener(this); // 내가 자식의 리스너가 된다.
                }
            }
        });
        ViewModel.notify(this); // 렌더 부하를 막기 위해 static 으로 rqAnimationFrame 한 번에 싹 모아서 노티 날림
        Object.seal(this);
    }
    // 내 자식을 업데이트 하기 위한 부분 --> 이름이 다 고유해야 하기 때문에 자식의 자식까지 표현하기 위해 subkey 만들 떄
    // 부모.자식.자식의_자식. 형태로 표현하는 로직이 필요하다...
    viewmodelUpdated(updated) {
        updated.forEach(v=>this.#isUpdated.add(v));
    }
};




const Processor = class {
    cat;
    constructor(cat) {
        this.cat = cat;
        Object.freeze(this);
    }
    process(vm, el, k, v, _0=type(vm, viewModel)) {
        this._process(vm, el, k, v);
    }
    _process(vm, el, k, v) {throw 'override'}
};

// 익명 상속된 클래스 -> 장점:
new (class extends Processor{
    _process(vm, el, k, v){el.style[k] = v;}
})('styles')
new (class extends Processor{
    _process(vm, el, k, v){el.setAttribute[k] = v;}
})('attributes')
new (class extends Processor{
    _process(vm, el, k, v){el[k] = v;}
})('properties')
new (class extends Processor{
    _process(vm, el, k, v){el.events[k] = v;}
})('events')

/**
 * 뷰모델 리스너이자 플레이스 홀더이자 바인더인 아이...
 * @type {Binder}
 */
const Binder = class extends ViewModelListener{
    #items = new Set; #processors = {};

    // 다른 곳에서 역하을 수행 ====> 비지터
    viewmodelUpdated(updated) {

        // 일회성 연산으로 메모리는 쓰지만 복잡한 알고리즘을 반복적으로 돌리지 않게됨.
        const items = {};
        this.#items.forEach(item=>{
            items[item.viewmodel] = [
                type(viewmodel[item.viewmodel], ViewModel),
                item.el
            ];
        });

        updated.forEach(v=>{
            if(!itms[v.subKey]) return;
            const [vm, el] = items[v.subKey], processor = this.#processors[v.cat];
            if (!el || !processor) return;
            processor.process(vm, el, v.k, v.v);
        });
    }
    add(v, _ = type(v, BinderItem)){this.#items.add(v);}
    addProcessor(v, _0=type(v, Proccessor)) {
        this.#processors[v.cat] = v;
    }
    render(viewmodel, _ = type(viewmodel, ViewModel)){
        const processores = Object.entries(this.#processors);
        this.#items.forEach(item=>{
            const vm = type(viewmodel[item.viewmodel], ViewModel), el = item.el;
            processores.forEach(([pk, processor])=>{
                // 전략 패턴
                // 객체를 위임해서 전략 패턴으로 "일반화" 하는 것이 어려움. 이 forEach 안의 내용을 짜는 것이 어렵다.
                Object.entries(vm[pk]).forEach(([k, v])=>{
                    processor.process(vm, el, k, v);
                });
            })
        });
    }


    /*
    notify 관련 기능 ========
     */
    watch(viewmodel, _ = type(viewmodel, ViewModel)) {
        viewmodel.addListener(this);
        this.render(viewmodel);// 새로 하나 등록 됐으니까
    }
    unwatch(viewmodel, _ = type(viewmodel, ViewModel)) {
        // TODO
    }





};

// ---> 오늘 한 것 정리
// 구조와 전략나눔
// 전략의 공통점
// 상태
// 도출된 형으로 알고리즘 수정.

/*
의존성이란
당연히 생김
이방향이 단뱡향이어야 한다. 상호참조하면 망....
고로 제대로 의존성을 만들었으면 Dependency Injection 이 반드시 생긴다. (내부에서 new 를 때리면 결국 코드를 고치게 되기 때문에
분리가 제대로 안된 것임)

 */


/**
 * ===================
 * Observer
 */





//### client

const scanner = new Scanner;
const binder = scnner.scan(sel(#target))
/binder. addProcessor(new (class extends))
// TODO


// 바인더를 콜하지 않음.. viewModel 만 건든다.


