
const dft_lingWidth = 6;

/**
 * 倾倒的水流
 */
export class WaterFlow extends cc.Graphics{
    onLoad(){
        this.lineWidth = dft_lingWidth;
        this.lineCap = cc.Graphics.LineCap.ROUND;
    }
    private _toPt:cc.Vec2 = cc.v2()
    public get toPt(){
        return this._toPt
    }
    public set toPt(val){
        this._toPt = val;
        this.clear();
        this.moveTo(this.from.x,this.from.y)
        this.lineTo(this._toPt.x,this._toPt.y);
        this.stroke();
    }

    private from:cc.Vec2 = cc.v2();
    /**
     * 倒水水流动画
     * @param from 
     * @param to 
     * @param dur 
     * @param isTail 开始出水false，最后一束水true
     */
    public playFlowAni(from:cc.Vec2,to:cc.Vec2,dur:number,isTail:boolean,onComplete:Function){
        
        this.clear();
        
        let flow:WaterFlow = this
        if(isTail){
            this.from = to;
        }else{
            this.from = from;
        }
        this.moveTo(this.from.x,this.from.y)
        let tw = cc.tween(flow)
            .set({toPt:from})
            .to(dur,{toPt:to})
            .call(onComplete)
            .start();
    }

    public setLineScale(scale:number){
        this.lineWidth = dft_lingWidth*scale;
    }
}