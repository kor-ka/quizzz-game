import * as React from "react";
import { SessionState } from "../../server/src/session/Session";
import { SessionContext } from "../App";
import { ClientUser } from "../../server/src/user/User";
import { Button, Input, FlexLayout } from "../ui/ui";
import { GameState } from "../model/GameModel";
import { ClientQuestion } from "../../server/src/game/Game";


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

    let reset = React.useCallback(() => {
        session!.io.emit({ type: 'SessionReset', id: session!.id })
    }, [state.state]);

    return <FlexLayout style={{ position: 'absolute', height: '100%', width: '100%', zIndex: 100 }} divider={0}>
        <Profile />

        {(state.state === 'await' || state.state === 'countdown') &&
            <Button
                onClick={startStop}
                style={{
                    opacity: loading ? 0.5 : 1,
                    position: 'fixed',
                    bottom: 20,
                    left: 20,
                    right: 20,
                    fontSize: 120,
                }} >
                {state.state === 'await' ? 'start' : Math.floor(Math.max(0, (state.ttl - new Date().getTime()) / 1000))}
            </Button>}
        {/* <Button onClick={reset} >RESET</Button> */}
    </FlexLayout>
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

    return <>{JSON.stringify(Array.from(state))}</>
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

    return <Input style={{ alignSelf: 'strech', textAlign: 'center', fontSize: 50, padding: 20, backgroundColor: 'rgba(100,100,100, 0.5)' }} defaultValue={me ? me.name : ''} onChange={onChange} placeholder="Your Name" />;
}


export const AnswerText = (props: { answers: string[], correctAnswer?: string, onPick: (answer: string) => void }) => {
    const [pickedAnswer, setAnsser] = React.useState<string>();

    const onPick = React.useCallback((answer: string) => {
        setAnsser(answer.toLowerCase());
        props.onPick(answer);
    }, []);

    return <>
        {props.answers.map(a => a.toLowerCase()).map((a) => <Button style={{
            backgroundColor: a !== pickedAnswer ? 'white' :
                (props.correctAnswer === undefined ? 'black' :
                    (a === props.correctAnswer ? 'limegreen' : 'maroon')),
            color: a === pickedAnswer ? 'white' : 'black',
        }} onClick={() => onPick(a)}>{a}</Button>)}
    </>
}

export const AnswerOpen = (props: { correctAnswer?: string, onPick: (answer: string) => void }) => {
    const [answer, setAnsser] = React.useState<string>();
    const onPick = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        let a = event.target.value;
        setAnsser(a.toLowerCase());
        props.onPick(a);
    }, []);
    let borderColor = props.correctAnswer === undefined ? 'black' :
        props.correctAnswer === answer ? 'limegreen' : 'maroon';
    return <>
        <Input style={{ border: `1px solid ${borderColor}`, borderRadius: 8 }} onChange={onPick} />
    </>
}

export const GameTTL = () => {
    let session = React.useContext(SessionContext);
    let [timeout, setTimeout] = React.useState(0);
    let [state, setState] = React.useState<GameState>(session!.game.state);

    React.useEffect(() => {
        let dispose = session!.game.listen(s => {
            setState(s);
        });
        return dispose;
    }, [session]);
    React.useEffect(() => {
        let interval = setInterval(() => {
            let left = Math.floor(Math.max(0, (state.ttl - new Date().getTime()) / 1000));
            setTimeout(left);
            if (left <= 0) {
                clearInterval(interval);
            }
        }, 100);
    }, [state.ttl]);

    return <>{timeout}</>;
}

export const Question = (props: { q: ClientQuestion, gid: string }) => {
    const [answer, setAnsser] = React.useState<string>();
    const [submited, setSubmited] = React.useState(false);
    const onPick = React.useCallback((answer: string) => {
        setAnsser(answer);
    }, []);
    let session = React.useContext(SessionContext);

    const onSubmit = React.useCallback(() => {
        if (!answer || submited) {
            return;
        }
        session!.io.emit({ type: 'Answer', gid: props.gid, answer, qid: props.q._id });
        setSubmited(true);
    }, [answer]);

    let aspect = window.innerWidth / (440 + 20);
    let offset = (310 + 20) * aspect;
    return <>

        <FlexLayout style={{ position: 'absolute', height: '100%', width: '100%', overflowY: 'scroll' }} divider={0}>

            <FlexLayout style={{ height: offset }} divider={0} >
                {/* <Button onClick={() => {
        setState({ ...state, state: state.state === 'question' ? 'subResults' : 'question' })
    }}> asdasd</Button> */}
            </FlexLayout>
            <FlexLayout style={{ flexGrow: 1, backgroundColor: 'rgba(100,100,100, 0.5)', padding: 20, paddingBottom: 68 }} divider={0}>
                <FlexLayout style={{ pointerEvents: submited ? 'none' : 'auto' }} >
                    {props.q.open && <AnswerOpen correctAnswer={props.q.answer} onPick={onPick} />}
                    {props.q.textAnswers && <AnswerText answers={props.q.textAnswers} correctAnswer={props.q.answer} onPick={onPick} />}
                </FlexLayout>

                <Button onClick={onSubmit} style={{
                    opacity: !answer || submited ? 0.5 : 1,
                    color: 'white',
                    fontSize: '22px',
                    background: 'black',
                    position: 'fixed', bottom: 20, right: 20,
                    borderRadius: 48,
                    width: 148,
                    height: 48,
                }}>{submited ? 'ANSWERED' : 'SUBMIT'}</Button>

                <Button style={{
                    backgroundColor: 'transparent',
                    opacity: 0.5,
                    color: 'black',
                    fontSize: '22px',
                    position: 'fixed',
                    bottom: 20, left: 20,
                    borderRadius: 48,
                    width: 148,
                    height: 48,
                    textAlign: 'left'

                }}><GameTTL /></Button>

            </FlexLayout>
        </FlexLayout>

    </>
}

export const Results = (props: { game: GameState }) => {
    return <FlexLayout style={{ height: '100%', width: '100%', padding: 20, overflowY: 'scroll' }}>
        {Array.from(props.game.scores.values()).sort((a, b) => b.score - a.score).map(us => {
            return <FlexLayout style={{ padding: 20, backgroundColor: 'rgba(100,100,100, 0.5)', borderRadius: 20 }}>{us.user.name + ': ' + us.score}</FlexLayout>
        })}
        <Button style={{
            backgroundColor: 'transparent',
            opacity: 0.5,
            color: 'black',
            fontSize: '22px',
            position: 'fixed',
            bottom: 20, left: 20,
            borderRadius: 48,
            width: 148,
            height: 48,
            textAlign: 'left'

        }}><GameTTL /></Button>
    </FlexLayout>
}

export const Game = () => {
    let session = React.useContext(SessionContext);
    let [state, setState] = React.useState<GameState>(session!.game.state);



    React.useEffect(() => {
        let dispose = session!.game.listen(s => {
            setState(s);
            // setState({
            //     ...s, question: {
            //         text: 'wop wop',
            //         _id: 'asd',
            //         category: 'asda',
            //         open: 'text'
            //         // textAnswers: ['1', ' asd', '12', 'dd asd', '3', '1', ' asd', '12', 'dd asd', '3']
            //     },
            //     state: 'question'
            // });
        });
        return dispose;
    }, [session]);


    return <>
        {session!.isMobile && state.state === 'question' && state.question && <Question key={state.question._id} q={state.question} gid={state.id!} />}
        {(state.state === 'subResults' || state.state === 'results') && <Results game={state} />}
        {!session!.isMobile && (
            <Button style={{
                backgroundColor: 'transparent',
                opacity: 0.5,
                color: 'black',
                fontSize: '22px',
                position: 'fixed',
                bottom: 20, left: 20,
                borderRadius: 48,
                width: 148,
                height: 48,
                textAlign: 'left'

            }}><GameTTL /></Button>
        )}
    </>;
}
