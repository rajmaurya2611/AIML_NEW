import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface AppState{
    activeView: string;
    activeChatSub: string;
    showInitial: boolean;
    collapsed: boolean;
    openKeys: string[];
    
}

const initialState: AppState = {
    activeView: 'chat',
    activeChatSub: 'patent',
    showInitial: true,
    collapsed: false,
    openKeys:["chat"],
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setActiveView(state, action: PayloadAction<string>){
            state.activeView = action.payload;
            state.showInitial = false;
        },
        setActiveChatSub(state, action: PayloadAction<string>){
            state.activeChatSub = action.payload;
        },
        setShowInitial(state, action: PayloadAction<boolean>){
            state.showInitial = action.payload;
        },
        toggleSidebar:(state)=>{
            state.collapsed = !state.collapsed;
        },
        setOpenKeys(state, action: PayloadAction<string[]>){
            state.openKeys = action.payload;
     },
    },
});

export const {setActiveView, setActiveChatSub, setShowInitial, toggleSidebar,setOpenKeys} = appSlice.actions;
export default appSlice.reducer;