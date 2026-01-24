import type { OrganizationResource } from '@clerk/shared/types';
import type { PropsOfComponent } from '../styledSystem';
import { Avatar } from './Avatar';
type OrganizationAvatarProps = PropsOfComponent<typeof Avatar> & Partial<Pick<OrganizationResource, 'name' | 'imageUrl'>> & {
    /** Shows a loading spinner while the image is loading */
    showLoadingSpinner?: boolean;
};
export declare const OrganizationAvatar: (props: OrganizationAvatarProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export {};
