'use client';

import Image, { ImageProps } from 'next/image';
import React, { useState, isValidElement, cloneElement } from 'react';
import { UserIcon } from 'lucide-react';
import { borderRadius, cn, ColorVariant, getInitials, RingProps, Shape } from '@/utils';
import { IconBox } from '@/components/shared/IconBox';

interface AvatarImageProps extends Omit<ImageProps, 'src' | 'alt'> {
    src?: string | null;
    alt?: string | null;
    name?: string | null;
    size?: number;
    className?: string;
    fallbackIcon?: React.ReactElement;
    fallbackColor?: ColorVariant;
    shape?: Shape;
    ring?: RingProps;
}

export function AvatarImage({
    src,
    alt,
    name,
    size = 40,
    className = '',
    fallbackIcon = <UserIcon />,
    fallbackColor = 'current',
    shape = 'rounded',
    ring,
    ...props
}: AvatarImageProps) {
    const [hasError, setHasError] = useState(false);
    const fallbackName = name || alt || '';
    const initials = fallbackName ? getInitials(fallbackName) : '';

    // Map size to width/height classes or inline style
    const inlineSizeStyle = { width: size, height: size };

    const shapeClass = borderRadius[shape]

    const ringWidthClass = ring?.size ? `ring-${ring.size}` : '';
    const ringClasses = ring
        ? `ring-${ring.color || 'black'} ${ringWidthClass} ring-offset-${ring.offset || 'white'}`
        : '';


    const containerClasses = cn(
        'avatar inline-flex items-center justify-center overflow-hidden',
        shapeClass,
        ringClasses,
        className
    );

    // Case 1: Image
    if (src && !hasError) {
        return (
            <div className={containerClasses} style={inlineSizeStyle}>
                <Image
                    src={src}
                    alt={alt || fallbackName || 'User Avatar'}
                    width={size}
                    height={size}
                    onError={() => setHasError(true)}
                    className={cn('object-cover', shapeClass)}
                    {...props}
                />
            </div>
        );
    }

    // Case 2: Initials
    if (initials) {
        return (
            <div className={containerClasses} style={inlineSizeStyle}>
                <div className={cn(
                    'avatar-placeholder flex items-center justify-center',
                    `text-${fallbackColor}-content`, // or use your textColors map
                    `bg-${fallbackColor}/10`        // or use your bgColors map
                )}
                >
                    {initials}
                </div>
            </div>
        );
    }

    // Case 3: Icon fallback
    let clonedIcon = fallbackIcon;
    if (isValidElement(fallbackIcon)) {
        clonedIcon = cloneElement(fallbackIcon, {
            ...(fallbackIcon.props ?? {}),
        });
    }

    return (
        <div className={containerClasses} style={inlineSizeStyle}>
            <IconBox
                icon={clonedIcon}
                color={fallbackColor}
                size={size <= 32 ? 'sm' : size <= 56 ? 'md' : 'lg'}
                shape={shape}
            />
        </div>
    );
}
