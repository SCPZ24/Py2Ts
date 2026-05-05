import { UserState } from "./application";

export function renderUser(state: UserState): string{
    switch(state.type){
        case "idle":
            return "<div>Load User</div>";
        case "loading":
            return "<div>Loading...</div>";
        case "success":
            return `<div>User: ${state.user.name}</div>`;
        case "error":
            return `<div>Error: ${state.error}</div>`;
        default:
            const _exhaustiveCheck: never = state;
            return _exhaustiveCheck;
    }
}