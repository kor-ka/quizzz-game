import * as React from "react";
import { SessionState } from "../../server/src/session/Session";
import { SessionContext } from "../App";
import { ClientUser } from "../../server/src/user/User";
import { FlexLayout, Button, Input } from "../ui/ui";
import { GameState } from "../model/GameModel";
import { ClientQuestion, answer } from "../../server/src/game/Game";

export const SessionComponent = () => {
    return <FlexLayout style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        <div><SessionStateComponent /></div>
        <div><Users /></div>
    </FlexLayout>;
}

export const SessionStateComponent = () => {
    let [state, setState] = React.useState<{ state: SessionState | 'connecting', ttl: number }>({ state: 'connecting', ttl: 0 });
    let [timeout, setTimeout] = React.useState(0);
    let [loading, setLoading] = React.useState(false);
    let session = React.useContext(SessionContext);
    React.useEffect(() => {
        let dispose = session!.subscribeSessionState(s => {
            setLoading(false);
            setState(s);
        });
        return dispose;
    }, [session]);

    React.useEffect(() => {
        let interval = setInterval(() => {
            let left = state.ttl - new Date().getTime();
            setTimeout(left);
            if (left <= 0) {
                clearInterval(interval);
            }
        }, 100);
    }, [state.ttl]);

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
        {state.state === 'countdown' && <div>
            {state.ttl - new Date().getTime()}
        </div>}
        {(state.state === 'await' || state.state === 'countdown') && <Button onClick={startStop} style={{ opacity: loading ? 0.5 : 1 }} >{state.state === 'await' ? 'start' : 'stop'}</Button>}
        <Profile />
    </>
}

export const Users = () => {
    let [state, setState] = React.useState<Map<string, ClientUser>>(new Map());
    let session = React.useContext(SessionContext);
    React.useEffect(() => {
        let dispose = session!.subscribeUsers(s => {
            setState(s);
        });
        return dispose;
    }, [session]);

    return <>{JSON.stringify(state)}</>
}

export const Profile = () => {
    let [me, setMe] = React.useState<ClientUser>();
    let session = React.useContext(SessionContext);
    React.useEffect(() => {
        let dispose = session!.subscribeMeUser(s => {
            setMe(s);
        });
        return dispose;
    }, [session]);

    let onChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        session!.io.emit({ type: 'UserRename', name: event.target.value })
    }, []);

    return <div>
        me: {JSON.stringify(me)}
        {me && <Input defaultValue={me.name} onChange={onChange} />}
    </div>
}


export const AnswerText = (props: { answers: string[], onPick: (answer: string) => void }) => {
    const [answer, setAnsser] = React.useState<string>();

    const onPick = React.useCallback((answer: string) => {
        setAnsser(answer);
        props.onPick(answer);
    }, []);
    return <>
        {props.answers.map((a) => <Button style={{ backgroundColor: a === answer ? 'gray' : 'white' }} onClick={() => onPick(a)}>{a}</Button>)}
    </>
}

export const AnswerOpen = (props: { onPick: (answer: string) => void }) => {
    const [answer, setAnsser] = React.useState<string>();
    const onPick = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        let a = event.target.value;
        setAnsser(a);
        props.onPick(a);
    }, []);
    return <>
        <Input style={{ border: '1px solid black', borderRadius: 8 }} onChange={onPick} />
    </>
}

export const Question = (props: { q: ClientQuestion }) => {
    const [answer, setAnsser] = React.useState<string>();
    const [submited, setSubmited] = React.useState(false);
    const onPick = React.useCallback((answer: string) => {
        setAnsser(answer);
    }, []);
    let session = React.useContext(SessionContext);

    const onSubmit = React.useCallback(() => {
        if (!answer) {
            return;
        }
        session!.io.emit({ type: 'Answer', gid: session!.game.id!, answer, qid: props.q._id })
        setSubmited(true);
    }, []);
    return <>

        <div>{props.q.text}</div>
        {props.q.open && <AnswerOpen onPick={onPick} />}
        {props.q.textAnswers && <AnswerText answers={props.q.textAnswers} onPick={onPick} />}

        <Button onClick={onSubmit} style={{ background: answer ? 'green' : 'gray' }}>{submited ? '🙈SEND' : ' ✅SENT'}</Button>

    </>
}

export const Game = () => {
    let session = React.useContext(SessionContext);
    let [state, setState] = React.useState<GameState>(session!.game.state);
    let [timeout, setTimeout] = React.useState(0);
    React.useEffect(() => {
        let dispose = session!.game.listen(s => {
            setState(s);
        });
        return dispose;
    }, [session]);

    React.useEffect(() => {
        let interval = setInterval(() => {
            let left = state.ttl - new Date().getTime();
            setTimeout(left);
            if (left <= 0) {
                clearInterval(interval);
            }
        }, 100);
    }, [state.ttl]);

    return <>
        <div>---{state.state}---</div>
        <div>{JSON.stringify(state.scores)}</div>
        {state.question && <Question q={state.question} />}
    </>;
}