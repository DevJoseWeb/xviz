// Copyright (c) 2019 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/* global Buffer */
/* eslint-disable camelcase */
import {open, TimeUtil} from 'rosbag';
import {quaternionToEuler} from '../common/quaternion';


export class ROSBag {
  // topicConfig should be provided  else simply map all topics to a matching converter
  constructor(bagPath, topicConfig = {}) {
    this.bagPath = bagPath;
    this.topicConfig = topicConfig;

    this.keyTopic = topicConfig.keyTopic || null;
    this.topics = topicConfig.topics;

    this.bagContext = {};
  }

  // Open the ROS Bag and collect information
  async init(ros2xviz) {
    const bag = await open(this.bagPath);

    await this._initBag(bag);

    this.topicMessageTypes = this._gatherTopics(bag);

    this._initTopics(this.topicMessageTypes, ros2xviz);

    return true;
  }

  /**
   * Clients may subclass and expand this method
   * in order to support any special processing for their specific
   * topics.
   *
   * Extracts:
   *   frameIdToPoseMap: ROS /tf transform tree
   *   start_time,
   *   end_time,
   *   origin: map origin
   */
  async _initBag(bag) {
    const TF = '/tf';
    const TF_STATIC = '/tf_static';

    this.bagContext.start_time = TimeUtil.toDate(bag.startTime).getTime() / 1e3;
    this.bagContext.end_time = TimeUtil.toDate(bag.endTime).getTime() / 1e3;

    const frameIdToPoseMap = {};
    await bag.readMessages({topics: [TF, TF_STATIC]}, ({topic, message}) => {
      message.transforms.forEach(t => {
        frameIdToPoseMap[t.child_frame_id] = {
          ...t.transform.translation,
          ...quaternionToEuler(t.transform.rotation)
        };
      });
    });

    this.bagContext.frameIdToPoseMap = frameIdToPoseMap;
  }

  _gatherTopics(bag) {
    const topicType = {};
    const topicMessageTypes = [];

    for (const conn in bag.connections) {
      const {topic, type} = bag.connections[conn];
      // Filter if 'topics' are provided
      if (!this.topics || this.topics.includes(topic)) {

        // Validate that the message type does not change
        if (topicType[topic] && topicType[topic].type !== type) {
          throw new Error(
            `Unexpected change in topic type ${topic} has ${
              topicType[topic].type
            } with new type ${type}`
          );
        } else if (!topicType[topic]) {
          // track we have seen it and add to list
          topicType[topic] = {type};
          topicMessageTypes.push({topic, type});
        }
      }
    }

    return topicMessageTypes;
  }

  // Using topics and message type, ensure we create a converter
  // for each topic.
  _initTopics(topicMessageTypes, ros2xviz) {
    ros2xviz.initializeConverters(topicMessageTypes, this.bagContext);
  }

  getMetadata(metadataBuilder, ros2xviz) {
    ros2xviz.buildMetadata(metadataBuilder, this.bagContext);

    metadataBuilder.startTime(this.bagContext.start_time);
    metadataBuilder.endTime(this.bagContext.end_time);
  }

  // Synchronize xviz messages by timestep
  async readMessage(start, end) {
    const bag = await open(this.bagPath);
    const frame = {};

    const options = {};

    if (start) {
      options.startTime = TimeUtil.fromDate(new Date(start * 1e3));
    }

    if (end) {
      options.endTime = TimeUtil.fromDate(new Date(end * 1e3));
    }

    if (this.topics) {
      options.topics = this.topics;
    }

    await bag.readMessages(options, async result => {
      // rosbag.js reuses the data buffer for subsequent messages, so we need to make a copy
      if (result.message.data) {
        // TODO(this needs to work in the browser)
        result.message.data = Buffer.from(result.message.data);
      }

      if (result.topic === this.keyTopic) {
        frame.keyTopic = result;
      }

      frame[result.topic] = frame[result.topic] || [];
      frame[result.topic].push(result);
    });

    return frame;
  }

  // TODO: move this to a differrent BagClass
  // We synchronize messages along messages in the `keyTopic`.
  /*
  async readMessageByKeyTopic(start, end) {
    const bag = await open(this.bagPath);
    let frame = {};

    async function flushMessage() {
      if (frame.keyTopic) {
        // This needs to be address, was used to flush on keyTopic message to sync
        // await onMessage(frame);
        frame = {};
      }
    }

    const options = {
      startTime: TimeUtil.fromDate(new Date(start * 1e3)),
      endTime: TimeUtil.fromDate(new Date(end * 1e3))
    };

    if (this.topics) {
      options.topics = this.topics;
    }

    await bag.readMessages(options, async result => {
      // rosbag.js reuses the data buffer for subsequent messages, so we need to make a copy
      if (result.message.data) {
        result.message.data = Buffer.from(result.message.data);
      }
      if (result.topic === this.keyTopic) {
        await flushMessage();
        frame.keyTopic = result;
      }
      frame[result.topic] = frame[result.topic] || [];
      frame[result.topic].push(result);
    });

    // Flush the final frame
    await flushMessage();
  }
  */
}
