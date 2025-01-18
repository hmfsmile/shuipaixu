import { AudioEnum, AudioUtil } from "../utils/audio_util";
import { createTexture } from "../utils/function";
import Water, { WaterInfo } from "./water";

const { ccclass, property } = cc._decorator;

export let WaterColors = [
    "#155DEF",
    "#F2C90F",
    "#BD2656",
    "#F0791F",
    "#454574",
    "#FE2D26",
    "#BCA6E3",
    "#E4584F",
    "#00B38A",
    "#DD2E44",
    "#E5C69A",
    "#65DC8E",
    "#B068F0",
    "#F010BF",
    "#538849",
]

/**高度乘数因子，满杯水只显示80% */
const HEIGHT_FACTOR = 0.8;

/**一杯水，分成四组四个颜色，0表示没有水 */
export interface _CupInfo{
    colorIds:Array<number>;//长度为4
}

const SPLIT_COUNT = 4;

@ccclass
export default class Cup extends cc.Component {
    @property(Water)
    private water:Water = null;

    private onClick:(c:Cup)=>void = null;

    onBtn_click(){
        if(this.isPouring()){
            return;
        }
        if(this.onClick){
            this.onClick(this);
        }
    }

    public isPouring(){
        return Math.abs(this.node.angle)>1.0;
    }

    initWater(){
        const info = this.info;
        let arr = [];
        for(let i=SPLIT_COUNT-1;i>=0;i--){
            let colorId = info.colorIds[i];
            if(colorId==0){
                continue;
            }
            let lastObj = arr[arr.length-1];
            if(!lastObj||lastObj!=colorId){
                arr.push({
                    height:1/SPLIT_COUNT,
                    colorId:colorId
                });
            }else{
                lastObj.height += 1/SPLIT_COUNT;
            }
        }
        arr.forEach(function (obj) {
            let hex = WaterColors[obj.colorId]||"#538849"
            // cc.log("obj.colorId",obj.colorId,"color",hex)
            obj.color = new cc.Color().fromHEX(hex);
            obj.height*=HEIGHT_FACTOR;
        })
        
        this.water.initInfos(arr);
    }

    private info:_CupInfo = null;
    setCupInfo(info:_CupInfo,onClick:(c:Cup)=>void){
        this.info = info;
        this.onClick = onClick;
        
        this.initWater();
        
        this.reset();
    }

    update(){
        if(CC_EDITOR){
            return;
        }
        if(this.water.skewAngle==this.node.angle){
            return;
        }
        this.water.skewAngle = this.node.angle;
    }

    private setPourOutCallback(pourStart,pourEnd){
        //水开始从瓶口流出来
        const _onStart = function(){
            if(pourStart){
                pourStart(this)
            }
            
        }
        //水倒完了
        const _onFinish = function(){
            if(this.tween){
                this.tween.stop();
                this.tween = null;
            }
            if(pourEnd){
                pourEnd(this)
            }
        }
        this.water.setPourOutCallback(_onStart.bind(this),_onFinish.bind(this));
    }

    private setPourInCallback(onFinish){
        //水倒完了
        const _onFinish = function(){
            let isFinished = this.checkIsFinshed();
            // cc.log("-----------isFinished",isFinished)
            if(onFinish){
                onFinish(this,isFinished)
            }
            if(isFinished){
                AudioUtil.playEffect(AudioEnum.finishOne,0.4)
            }
        }
        this.water.setPourInCallback(_onFinish.bind(this));
    }

    /**是否完成了（同颜色填满整个杯子） */
    checkIsFinshed(){
        let isFinished = true;
        let colorIds = this.info.colorIds;
        let tmpId = null;
        let empTyNum = 0;
        for(let i=0;i<SPLIT_COUNT;i++){
            if(tmpId==null){
                tmpId = colorIds[i]
            }
            if(tmpId!=colorIds[i]){
                isFinished = false;
                break;
            }else if(colorIds[i]==0){
                empTyNum++;
            }
        }
        if(empTyNum==SPLIT_COUNT){
            isFinished = true;
        }
        return isFinished;
    }

    private tween:cc.Tween = null;
    /**
     * 移动到目标点、旋转瓶子并倒水
     * @param isRight 倾斜角度，向左为正，右为负
     * @param onPourStart 水开始从瓶口流出来
     * @param onPourEnd 本次水倒完了
     */
    moveToPour(dstPt:cc.Vec2,isRight:boolean,onPourStart:(c:Cup)=>void,onPourEnd:(c:Cup)=>void){
        this.setPourOutCallback(onPourStart,onPourEnd);

        let startAngle = this.water.getPourStartAngle()
        let endAngle = this.water.getPourEndAngle()

        this.water.onStartPour();
        if(isRight){
            startAngle*=-1;
            endAngle*=-1;
        }

        let moveDur = 0.5;
        let pourDur = 0.8;

        this.tween = cc.tween(this.node)
            .set({angle:0})
            .to(moveDur,{x:dstPt.x,y:dstPt.y,angle:startAngle})
            .to(pourDur,{angle:endAngle})
            .call(()=>{
                this.tween = null;
            }).start();

        let top = this.getTop();
        let colorIds = this.info.colorIds;
        for(let i=0;i<SPLIT_COUNT;i++){
            let _id = colorIds[i]
            if(_id==0){
                continue;
            }else if(top.topColorId==_id){//顶部相同颜色的水都倒掉了
                colorIds[i] = 0;
            }else{
                break;
            }
        }
    }

    startAddWater(colorId:number,num:number,onComplete:(cup:Cup,isFInish:boolean)=>void){
        this.setPourInCallback(onComplete);
        let acc = 0;
        for(let i=SPLIT_COUNT-1;i>=0;i--){
            if(this.info.colorIds[i]!=0){
                continue;
            }
            this.info.colorIds[i] = colorId;
            if(++acc==num){
                break;
            }
        }
        let hex = WaterColors[colorId]||"#538849"
        this.water.addInfo({
            colorId:colorId,
            height:num/SPLIT_COUNT *HEIGHT_FACTOR,
            color:new cc.Color().fromHEX(hex)
        });

        AudioUtil.playPourWaterEffect(num/SPLIT_COUNT);
    }

    /**加水立刻 */
    addWaterImmediately(colorId:number,num:number){
        let acc = 0;
        for(let i=SPLIT_COUNT-1;i>=0;i--){
            if(this.info.colorIds[i]!=0){
                continue;
            }
            this.info.colorIds[i] = colorId;
            if(++acc==num){
                break;
            }
        }
        this.initWater();
    }

    /**将顶部的颜色删除num个 */
    removeTopWaterImmediately(num:number){
        let acc = 0;
        let top = this.getTop();
        let colorIds = this.info.colorIds;
        for(let i=0;i<SPLIT_COUNT;i++){
            let _id = colorIds[i]
            if(_id==0){
                continue;
            }else if(top.topColorId==_id){//顶部相同颜色的水都倒掉了
                colorIds[i] = 0;
                if(++acc>=num){
                    break
                }
            }else{
                break;
            }
        }
        this.initWater();
        return top;
    }

    getTop(){
        let colorIds = this.info.colorIds;
        let emptyNum = 0;//杯顶的空位有几格
        let topColorId = 0;//杯顶颜色id
        let topColorNum = 0;//杯顶的颜色共有几格
        for(let i=0;i<SPLIT_COUNT;i++){
            if(colorIds[i]==0){
                emptyNum++;
                continue;
            }
            if(topColorId==0||topColorId==colorIds[i]){
                topColorId = colorIds[i];
                topColorNum++;
            }else{
                break;
            }
        }
        return {
            emptyNum:emptyNum,
            topColorId:topColorId,
            topColorNum:topColorNum,
            colorHex:WaterColors[topColorId]||"#538849"
        }
    }

    reset(){
        this.node.angle = 0;
        this.water.skewAngle = 0
    }

    public setPourAnchor(isRight:boolean){
        let pt = cc.v2(3,2);
        pt.x = isRight?(this.node.width-pt.x):pt.x;
        pt.y = this.node.height-pt.y;
        
        pt.x = pt.x/this.node.width;
        pt.y = pt.y/this.node.height;

        this.setAnchor(pt) 
    }

    public setNormalAnchor(){
        this.setAnchor(cc.v2(0.5,0.5))
    }

    private dot:cc.Node = null;
    private setAnchor(anchor:cc.Vec2){
        // if(this.dot==null){
        //     this.dot = new cc.Node();
        //     this.dot.parent = this.node;
        //     let label = this.dot.addComponent(cc.Sprite);
        //     label.spriteFrame = new cc.SpriteFrame(createTexture())
        //     this.dot.color = cc.Color.RED;
        // }
        // this.dot.setPosition(0,0)

        let oldAnchor = this.node.getAnchorPoint();
        let selfPt = this.node.getPosition();//当前锚点世界坐标
        
        let waterPt = this.water.node.getPosition();
        this.node.setAnchorPoint(anchor);
        let offsetAnchor = cc.v2(anchor.x-oldAnchor.x,anchor.y-oldAnchor.y)
        let offsetPt = cc.v2(offsetAnchor.x*this.node.width,offsetAnchor.y*this.node.height)
        offsetPt = rotatePt(offsetPt,this.node.angle)
        selfPt.x += offsetPt.x;
        selfPt.y += offsetPt.y;
        this.node.setPosition(selfPt);
        waterPt.x -= offsetAnchor.x*this.node.width;
        waterPt.y -= offsetAnchor.y*this.node.height;
        this.water.node.setPosition(waterPt);

    }

    /**获取当前水面的global y坐标 */
    getWaterSurfacePosY(needAdjust=false){
        let top = this.getTop();
        let y = (SPLIT_COUNT-top.emptyNum)/SPLIT_COUNT;
        if(y<0.02){
            y = 0.02
        }else if(needAdjust){
            y-=1.0/SPLIT_COUNT*HEIGHT_FACTOR;
        }
        y*=HEIGHT_FACTOR;
        y-=0.5;
        let pt = cc.v2(0,this.water.node.height*y);
        pt = this.water.node.convertToWorldSpaceAR(pt)
        return pt.y
    }
}

function rotatePt(pt:cc.Vec2,angle:number){
    let radian = angle2radian(angle);
    let ret = cc.v2();
    ret.x = pt.x*Math.cos(radian)-pt.y*Math.sin(radian);
    ret.y = pt.x*Math.sin(radian)+pt.y*Math.cos(radian);

    return ret;
}

function angle2radian(angle:number){
    while(angle>360){
        angle-=360;
    }
    while(angle<-360){
        angle+=360;
    }
    return (angle%360) * Math.PI / 180.0;
}