
import { DlgSetting } from "./dialog/dlg_setting";
import { DlgYouWin } from "./dialog/dlg_youWIn";
import { AudioEnum, AudioUtil } from "./utils/audio_util";
import { CupMgr } from "./views/cupMgr";


const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayScene extends cc.Component {
    @property(CupMgr)
    private cupMgr: CupMgr = null;
    @property(cc.Label)
    private text_level:cc.Label = null;
    @property(cc.Label)
    private text_actionNum:cc.Label = null;

    onLoad(){
        this.cupMgr.node.on("level_finish",this.onFinishOneLevel,this);
        this.cupMgr.node.on("do_pour",this.onPourAction,this);
    }

    onDestroy(){
        this.cupMgr.node.off("level_finish",this.onFinishOneLevel,this);
        this.cupMgr.node.off("do_pour",this.onPourAction,this);
    }

    start(){
        this.text_level.string = `level_${this.cupMgr.getLevel()}`
        this.text_actionNum.string = this.cupMgr.getActionNum()+'';
    }

    onFinishOneLevel(){
        AudioUtil.playEffect(AudioEnum.youWin);
        DlgYouWin.show(()=>{
            this.cupMgr.nextLevel()
            this.text_level.string = `level_${this.cupMgr.getLevel()}`
            this.text_actionNum.string = this.cupMgr.getActionNum()+'';
        })
    }

    onPourAction(){
        this.text_actionNum.string = this.cupMgr.getActionNum()+'';
    }

    onBtn_restart(){
        this.cupMgr.nextLevel();
        this.text_actionNum.string = this.cupMgr.getActionNum()+'';
    }

    onBtn_recover(){
        this.cupMgr.undoAction();
        this.text_actionNum.string = this.cupMgr.getActionNum()+'';
    }

    onBtn_tip(){

    }

    onBtn_setting(){
        DlgSetting.show();
    }
}
