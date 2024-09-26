import React from 'react';
import { Route } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import useRouteLoading from '../hooks/useRouteLoading';

const RouteWithLoading = ({ element, ...rest }) => {
  const loading = useRouteLoading();

  return (
    <>
      {loading && (
        <div className="spinner-container">
          <ClipLoader color="#ffffff" loading={loading} size={150} />
        </div>
      )}
      <Route {...rest} element={element} />
    </>
  );
};

export default RouteWithLoading;
