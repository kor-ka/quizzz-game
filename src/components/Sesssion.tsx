import * as React from "react";
import { SessionState } from "../../server/src/Session";
import { SessionContext } from "../App";
import { ClientUser } from "../../server/src/user/User";
import { FlexLayout, Button } from "../ui/ui";

export const SessionComponent = () => {
    return <FlexLayout style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        <div><SessionStateComponent /></div>
        <div><Users /></div>
    </FlexLayout>;
}

export const SessionStateComponent = () => {
    let [state, setState] = React.useState<{ state: SessionState | 'connecting', ttl: number }>({ state: 'connecting', ttl: 0 });
    let [loading, setLoading] = React.useState(false);
    let session = React.useContext(SessionContext);
    React.useEffect(() => {
        let dispose = session!.subscribeSessionState(s => {
            setLoading(false);
            setState(s);
        });
        return dispose;
    }, [session]);

    let startStop = React.useCallback(() => {
        setLoading(true);
        if (state.state === 'await') {
            session!.io.emit({ type: 'SessionStartGameCountdown', id: session!.id })
        } else {
            session!.io.emit({ type: 'SessionStopGameCountdown', id: session!.id })
        }
    }, [state.state]);

    return <>
        {JSON.stringify(state)}
        <Button onClick={startStop} style={{ opacity: loading ? 0.5 : 1 }} >{state.state === 'await' ? 'start' : 'stop'}</Button>
    </>
}

export const Users = () => {
    let [state, setState] = React.useState<ClientUser[]>([]);
    let session = React.useContext(SessionContext);
    React.useEffect(() => {
        let dispose = session!.subscribeUsers(s => {
            setState(s);
        });
        return dispose;
    }, [session]);

    return <>{JSON.stringify(state)}</>

}