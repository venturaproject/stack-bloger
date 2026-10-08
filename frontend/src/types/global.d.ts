import { AxiosInstance } from 'axios';
import route from '@/lib/route';

declare global {
    interface Window {
        axios: AxiosInstance;
    }

    /* eslint-disable no-var */
    var route: typeof route;
}
