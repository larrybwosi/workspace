import React, { Suspense, lazy } from 'react';

export default function dynamic(
  loader: () => Promise<any>,
  _options: any = {}
) {
  const LazyComponent = lazy(async () => {
    const component = await loader();
    if (component && component.default) {
      return { default: component.default };
    }
    return { default: component };
  });

  return function DynamicComponent(props: any) {
    return (
      <Suspense fallback={null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
