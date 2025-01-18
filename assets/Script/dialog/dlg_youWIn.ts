import { BaseDialog } from "./base_dialog";

const {ccclass, property} = cc._decorator;

@ccclass
export class DlgYouWin extends BaseDialog{
    private onNext:Function = null;
    initView(onNext:Function) {
        this.onNext = onNext;
    }

    exitView() {
        
    }
    
    onBtn_Next(){
        this.dismiss(true);
        if(this.onNext){
            this.onNext();
        }
    }

    static show(onNext){
        DlgYouWin.create("prefabs/dialog_youWIn",onNext)
    }
}