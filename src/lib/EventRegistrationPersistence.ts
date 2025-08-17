/**
 * We define a type that refers to one-shot callbacks
 */
interface CallbackWithCleanup extends Function {}

export type EventRegistrationPersistence = Record<
  string,
  [Function, CallbackWithCleanup?][]
>;

import { isProxy } from "node:util/types";

/**
 * Do not restore registrations on a proxied object
 */
export function restoreEventRegistrations<
  T extends {
    on: Function;
    once: Function;
    off: Function;
  }
>(obj: T, cache: EventRegistrationPersistence) {
  if (isProxy(obj)) {
    throw new Error("Cannot restore event registrations on a proxied object");
  }

  for (const [evt, [callback, callbackWithCleanup]] of Object.entries(cache)) {
    if (callbackWithCleanup) {
      obj.once(evt, callbackWithCleanup as any);
    } else {
      obj.on(evt as any, callback as any);
    }
  }
}

export function flattenEventRegistration(cache: EventRegistrationPersistence) {
  return Object.entries(cache).flatMap(([event, registrations]) =>
    registrations.map(([callback, callbackWithCleanup]) => ({
      event,
      callback,
      once: !!callbackWithCleanup,
    }))
  );
}

export function proxyEventRegistrationInterface<
  T extends {
    on: Function;
    once: Function;
    off: Function;
  }
>(obj: T, cache: EventRegistrationPersistence) {
  function unregisterListener(evt: string, callback: Function) {
    if (cache[evt]) {
      cache[evt] = cache[evt].filter(([fn]) => fn !== callback);
    }
  }

  console.log('obj is', obj);
  const proxy = new Proxy(obj, {
    get: (target, prop, receiver) => {
      // if (prop === "on") {
      //   return (evt: string, callback: Function) => {
      //     cache[evt] = cache[evt] || [];
      //     cache[evt].push([callback]);
      //     return target.on(evt as any, callback as any);
      //   };
      // }

      // if (prop === "once") {
      //   return (evt: string, callback: Function) => {
      //     cache[evt] = cache[evt] || [];

      //     const callbackwithCleanup = (...args: any[]) => {
      //       unregisterListener(evt, callback);
      //       callback(...args);
      //     };

      //     cache[evt].push([callback, callbackwithCleanup]);
      //     return target.once(evt as any, callbackwithCleanup as any);
      //   };
      // }

      // if (prop === "off") {
      //   return (evt: string, callback: Function) => {
      //     unregisterListener(evt, callback);
      //     return target.off(evt as any, callback as any);
      //   };
      // }
      return Reflect.get(target, prop, receiver);
    },
  });

  return proxy;
}
