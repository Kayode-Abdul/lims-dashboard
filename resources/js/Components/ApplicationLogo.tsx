import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/image_1_1773683600563.jpg"
            alt="Laboratory Logo"
            className={`object-contain ${props.className || ''}`}
        />
    );
}
