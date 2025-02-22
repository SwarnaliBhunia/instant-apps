import React from "react";
import styled from "styled-components";
import {
  isTriggered,
  InstantAppProps,
  queryToDataInput,
  queryToDataOutput,
} from "@felvin-search/core";

import _ from "lodash";

//------------Styled Components-------------
const RowContainer = styled.div`
  display: flex;
  flex-direction: row;

  align-items: center;
`;

const ColContainer = styled.div`
  display: flex;
  flex-direction: column;

  margin: 0.5rem 1rem;
`;

const TrackingContainer = styled.div`
  h1 {
    font-size: 1.5rem;
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
`;

const StatusArrayContainer = styled.div`
  overflow-y: auto;
  height: 300px;
  span.statusHeading {
    font-weight: bold;
  }
`;

const InfoContainer = styled.div`
  padding: 0.5rem;
  margin-left: 0.5rem;
  div.heading {
    font-weight: bold;
  }
`;

const PickrrLink = styled.a`
  color: inherit;
  font-size: small;
  float: right;
`;

//=========================================

function TrackingInfo(props) {
  const data = props.data,
    info = data.info,
    trackingUrl = `https://pickrr.com/tracking/#/?tracking_id=${data.tracking_id}`;
  return (
    <InfoContainer>
      <RowContainer>
        <ColContainer key="courierName">
          <div className="heading">Courier</div>
          <br />
          <div>{_.upperFirst(info.courier_name)}</div>
        </ColContainer>
        <ColContainer key="courierOrderId">
          <div className="heading">Order ID</div>
          <br />
          <div>{_.upperFirst(data.client_order_id)}</div>
        </ColContainer>
        <ColContainer key="courierId">
          <div className="heading">Courier Tracking ID</div>
          <br />
          <div>{_.upperFirst(data.courier_tracking_id)}</div>
        </ColContainer>
      </RowContainer>
      <br />
      <RowContainer>
        <ColContainer key="fromAddress">
          <div className="heading">From</div>
          <br />
          <div>{_.upperFirst(info.from_city)}</div> <br />
          <em>{info.from_pincode}</em>
        </ColContainer>
        <ColContainer key="toAddress">
          <div className="heading">To</div>
          <br />
          <div>{_.upperFirst(info.to_city)}</div>
          <br />
          <em>{info.to_pincode}</em>
        </ColContainer>
      </RowContainer>
      <br />
      <RowContainer>
        <p>
          {" "}
          <b>Current Status</b>: {data.status.current_status_body} <br />
          <b>Location</b>: {data.status.current_status_location} <br />
          <em>Updated on: {data.status.current_status_time} </em>
        </p>
      </RowContainer>
      <PickrrLink href={trackingUrl} target="_blank">
        View on Pickrr
      </PickrrLink>
    </InfoContainer>
  );
}

const triggerWords = [
  "track",
  "pickrr",
  "courier",
  "tracking number",
  "delivery status",
  "current status",
];
const numberPattern = /\d+/g;

/**
 * The UI logic of the app.
 */
function Component(props: InstantAppProps) {
  const data = props.data;
  const statusArray = _.reverse(
    _.flatten(
      _.map(data.track_arr, (track_object) => track_object.status_array)
    )
  );
  return (
    <TrackingContainer>
      <h1>Courier Tracking Status</h1>
      {data.err && <div>{data.err}</div>}
      <TrackingInfo data={data} />

      <h2>Updates</h2>
      <StatusArrayContainer>
        {_.map(statusArray, (statusObject) => {
          return (
            <RowContainer>
              <p>
                <span className="statusHeading">
                  {statusObject.status_body}
                </span>{" "}
                <br />
                <small>at</small> {statusObject.status_location} <br />
                <small>on</small> <em>{statusObject.status_time}</em>
              </p>
            </RowContainer>
          );
        })}
      </StatusArrayContainer>
    </TrackingContainer>
  );
}

async function queryToData({
  query,
}: queryToDataInput): Promise<queryToDataOutput> {
  // If the query does not contain the following words, do not trigger the app
  // `define`, `meaning`
  if (!isTriggered(query, triggerWords, { substringMatch: true })) return;
  // Extract tracking number from the query
  let trackingNumbers = query.match(numberPattern);
  const baseUrl =
    "https://cfapi.pickrr.com/plugins/tracking/?format=json&tracking_id=";
  let results = await Promise.all(
    _.map(trackingNumbers, (number) => {
      return fetch(baseUrl + _.toString(number))
        .then((response) => response.json())
        .then((responseData) => {
          let result = null;
          if (responseData && !responseData.err) {
            result = responseData;
          }
          return result;
        });
    })
  );
  results = _.compact(results);

  return results[0];
}

export { queryToData, Component };
