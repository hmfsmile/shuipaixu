const { ccclass, property } = cc._decorator;

export enum AudioEnum{
    button = "audio/Button_Click",
    finishOne = "audio/ContainerFinish",
    pourWater = "audio/pourWater",
    youWin = "audio/Show_Victory",
}

export class AudioUtil{
    static preloadAll(){
        let arr = [];
        for(let key in AudioEnum){
            let path = AudioEnum[key];
            arr.push(path)
        }
        cc.resources.preload(arr);
    }
    static unloadAll(){
        for(let key in AudioEnum){
            let path = AudioEnum[key];
            cc.resources.release(path,cc.AudioClip);
        }
    }

    static async playEffect(path:AudioEnum|string,volume=1){
        let clip = await this.loadClip(path);
        return cc.audioEngine.play(clip,false,volume);
    }

    /**
     * 播放倒水声音，根据倒水容量播放不同的时间
     * @param time 【0,1】
     */
    static async playPourWaterEffect(time:number){
        let clip = await this.loadClip(AudioEnum.pourWater);
        let id = cc.audioEngine.play(clip,false,1.0);
        let dur = 3.0*time;
        setTimeout(() => {
            cc.audioEngine.stop(id)
        }, dur*1000);
    }

    private static  async loadClip(path:string){
        return new Promise<cc.AudioClip>(function (resove,reject) {
            cc.resources.load(path,cc.AudioClip,(err:Error,clip:cc.AudioClip)=>{
                if(err){
                    // reject(err)
                    resove(null)
                }else{
                    resove(clip)
                }
            })
        })
    }
}