import fs from 'fs';

import {
  ROSBagProvider,
  ROS2XVIZFactory
} from '@xviz/ros';

import {XVIZProviderFactory} from '@xviz/io';
import {KittiBag} from './kitti-bag';

import {
  SensorImage,
  SensorNavSatFix,
  SensorPointCloud2
} from '@xviz/ros';

export function setupCustomProvider(options) {
  // Setup ROS support based on arguments
  //
  // Custom Converters should be added here
  const ros2xvizFactory = new ROS2XVIZFactory([
    SensorImage,
    SensorNavSatFix,
    SensorPointCloud2
  ]);

  const {rosConfig} = options;
  let config = null;
  if (rosConfig) {
    // topicConfig: { keyTopic, topics }
    // mapping: [ { topic, name, config: {xvizStream, field} }, ... ]
    const data = fs.readFileSync(rosConfig);
    if (data) {
      config = JSON.parse(data);
    }
  }

  const rosbagProviderConfig = {
    ...config,
    // topicConfig
    // mapping

    // logger

    BagClass: KittiBag,
    ros2xvizFactory,
  };
  XVIZProviderFactory.addProviderClass(ROSBagProvider, rosbagProviderConfig);
}
