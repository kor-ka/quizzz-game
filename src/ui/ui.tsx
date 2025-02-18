import * as React from "react";
import Glamorous from "glamorous";
export const isChromium = (window as any).chrome;

export const FlexLayout = Glamorous.div<{
    divider?: number;
    style?: React.CSSProperties;
}>(props => ({
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    WebkitOverflowScrolling: "touch",
    boxSizing: "border-box",
    "> *": props.style && props.style.flexDirection === 'row' ? {
        marginLeft: props.divider !== undefined ? props.divider : 5,
        marginRight: props.divider !== undefined ? props.divider : 5
    } : {
            marginTop: props.divider !== undefined ? props.divider : 5,
            marginBottom: props.divider !== undefined ? props.divider : 5
        },
    ">:first-child": props.style && props.style.flexDirection === 'row' ? {
        marginLeft: 0
    } : {
            marginTop: 0
        },
    ">:last-child": props.style && props.style.flexDirection === 'row' ? {
        marginRight: 0
    } : {
            marginBottom: 0
        },
    ...props.style
}));

export const Landscape = Glamorous.div({
    '@media only screen and (orientation: portrait)': {
        display: 'none',
    }
});

export const Portrait = Glamorous.div({
    '@media only screen and (orientation: landscape)': {
        display: 'none',
    }
});

const ButtonInner = Glamorous.div<{ type?: 'danger' }>((props) => ({
    minWidth: 28,
    color: 'black',
    whiteSpace: 'pre-wrap',
    fontSize: '16px',
    backgroundColor: props.type === 'danger' ? 'rgba(250, 200, 200, 0.6)' : 'rgba(250, 250, 250, 0.6)',
    padding: 1,
    paddingTop: 11,
    paddingBottom: 9,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'center',
    userSelect: 'none',

    ':focus': {
        outline: 0
    },

}));

export const Button = (props: { className?: string, style?: React.CSSProperties, onClick?: () => void, type?: 'danger', children?: any }) => <ButtonInner type={props.type} className={props.className} style={props.style} onClick={props.onClick}>{props.children}</ButtonInner>

export const TextContentStyled = Glamorous.div<{ selected?: boolean }>(
    props => ({
        whiteSpace: "pre-wrap",
        border: props.selected ? "1px solid #3E5C6B" : undefined,
        color: "rgba(0, 0, 0, 0.8)",
        fontSize: "16px",
        backgroundColor: "rgba(250, 250, 250, 0.4)",
        padding: 10,
        borderRadius: 10,
        userSelect: 'none',
        cursor: "pointer"
    })
);

export const ActionTextContentStyled = Glamorous.div<{ selected?: boolean }>(
    props => ({
        whiteSpace: "pre-wrap",
        color: "rgba(0, 0, 0, 0.8)",
        fontSize: "16px",
        backgroundColor: "rgba(250, 250, 250, 0.4)",
        padding: 10,
        userSelect: 'none',
        borderRadius: 10
    })
);

export const Input = Glamorous.input({
    minHeight: 24,
    outline: 0,
    borderWidth: '0 0 0px',
    backgroundColor: 'transparent',
    fontSize: 16,
    minWidth: 50,
    lineHeight: 1.5,
    appearance: 'none',
});

