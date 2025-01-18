import { GlobalNodeNames } from "../global_node";


let ANIM_TAG = 10087;

let ScaleSize = 0.5;

export enum WindowStyle {
    POPUP,
    NORMAL,
};
const {ccclass, property} = cc._decorator;
@ccclass
export abstract class BaseDialog extends cc.Component{
    private m_manager:any = null;
    private m_isInAnim:boolean = false;
    private _tag:any = "";
    public get tag(){return this._tag;}
    protected isPfbRaw:boolean = false; //为true时,tag表示路径

    @property({
        type:cc.Enum(WindowStyle),
        tooltip:"弹窗样式,POPUP有弹窗动画，NORMAL直接显示"
    })
    public style:WindowStyle = WindowStyle.POPUP;
    @property({
        tooltip:"是否点击背后隐藏"
    })
    public closeByTouchBg = true;
    @property({
        tooltip:"是否点击返回键隐藏"
    })
    public closeByTouchBack = true;
    @property(cc.Vec2)
    private offset = cc.v2(0,0);
    @property({
        tooltip:"黑色半透明遮罩的透明度"
    })
    public maskOpacity = 128;
    @property({
        tooltip:"是否全屏"
    })
    public isFullScreen = false;

    /**是否正在做弹窗动画，此时点击关闭背景无效 */
    public get isPupuAni(){
        return this.m_isInAnim;
    }

    /**显示弹窗，为避免死锁，在popuManager里实现 */
    static async create<T>(pfb:string|cc.Prefab,param?:T|any,...args):Promise<BaseDialog>{
        // PopupMgr.getInstance().showWindow(pfb,param)
        return null;
    }

    ///屏蔽父类的onLoad，事件注册在PopupMgr里处理了
    onLoad(){
        if(this.isFullScreen){
            this.node.width = display.width;
            this.node.height = display.height;
        }else{
            this.node.position = new cc.Vec3(this.offset.x,this.offset.y);
        }
    }
    ///屏蔽父类的onDestroy，事件注销在PopupMgr里处理了
    onDestroy(){
        this.exitView();
        // let config = this.getRawAssetsConfig();
        // if(this.isPfbRaw){
        //     config.prefab = this.tag;
        // }
        // super.onDestroy();
    }

    /**销毁前调用，有需要在销毁时刻运用节点树的资源时重写这个*/
    onPreDestroy(){

    }

    /**获取弹窗出现时的动画 */
    protected getShowAnim():cc.ActionInterval{
        return null;
    }

    /**获取弹窗关闭时的动画 */
    protected getHideAnim():cc.ActionInterval{
        return null;
    }

    protected getDftHideAni(){
        let _duartion = 0.3;
        let ani = cc.scaleTo(_duartion,ScaleSize);
        ani = ani.easing(cc.easeBackIn());
        return ani;
    }
    protected getDftShowAni(){
        let _duartion = 0.3;
        this.node.setScale(ScaleSize);
        let ani = cc.sequence(
            cc.scaleTo(0,ScaleSize),
            cc.scaleTo(_duartion,1.0).easing(cc.easeBackOut()),
        );
        return ani;
    }

    // /**初始化资源，用于加载和释放 */
    // protected getRawAssetsConfig():_RawAssetsConfig{
    //     return {}
    // }

    initWindow(manager:any,tag,isPfbRaw:boolean,onLoadComplete:Function){
        this.m_manager = manager;
        this.m_isInAnim = false;//是否正在做动画
        this._tag = tag;
        this.isPfbRaw = isPfbRaw;

        // _loadRawAssets(this.getRawAssetsConfig(),(result)=>{
        //     if(result=="complete"){
                onLoadComplete();
        //     }
        // })
    }

    abstract initView(bundleData?:any,arg1?:any,arg2?:any,arg3?:any);
    abstract exitView(bundleData?:any);
    refreshView(bundleData?:any,arg1?:any,arg2?:any,arg3?:any){}
    
    showWindow(bundleData:any,arg1?:any,arg2?:any,arg3?:any){ 
        this.initView(bundleData,arg1,arg2,arg3);

        //播放动画
        if(this.m_isInAnim || !this.node.active)
            return;
        this.node.setScale(1);
        this.node.stopActionByTag(ANIM_TAG);
        let _action = this.getShowAnim();
        if(_action==null&&this.style==WindowStyle.POPUP){
            _action = this.getDftShowAni();
        }
        if(_action){
            _action.setTag(ANIM_TAG);
            this.m_isInAnim = true;
            let finish = cc.callFunc(function(){
                this.onShowEnd();
            },this);
            this.node.runAction(cc.sequence(_action,finish));
        }else{
            this.onShowEnd();
        }
    }
    onShowEnd(){
        this.m_isInAnim = false;
    }
    dismiss(noAnim:boolean = false,data?:any){
        if(noAnim){
            this.onHideEnd(data);
            return;
        }
        if(this.m_isInAnim)
            return;
        this.node.setScale(1);
        this.node.stopActionByTag(ANIM_TAG);

        let _action = this.getHideAnim();
        if(_action==null&&this.style==WindowStyle.POPUP){
            _action = this.getDftHideAni();
        }
        if(_action){
            _action.setTag(ANIM_TAG);
            this.m_isInAnim = true;
            let finish = cc.callFunc(function(){
                this.onHideEnd(data);
            },this)
            this.node.runAction(cc.sequence(_action,finish));
        }else{
            this.onHideEnd(data);
        }
    }

    private _onClosed:Function = null;
    public setOnClosed(func:Function){
        this._onClosed = func;
    }

    protected onHideEnd(data?:any){
        this.m_isInAnim = false;
        this.node.active = false;
        if(this._onClosed){
            this._onClosed(this);
            this._onClosed = null;
        }
        if(this.m_manager&&this.m_manager.node.active){
            this.m_manager.onHideEnd(this);
        }
    }

    protected onBtnClose(){
        this.dismiss();
    }
}