import type { OrganizationResource } from '@clerk/shared/types';
import type { AvatarUploaderProps } from '@/ui/elements/AvatarUploader';
export declare const OrganizationProfileAvatarUploader: (props: Omit<AvatarUploaderProps, "avatarPreview" | "title"> & {
    organization: Partial<OrganizationResource>;
    /** Shows a loading spinner while the image is loading */
    showLoadingSpinner?: boolean;
}) => import("@emotion/react/jsx-runtime").JSX.Element;
