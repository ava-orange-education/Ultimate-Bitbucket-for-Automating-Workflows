const addDynamicStep = (request) => {
  // Check if the default pipeline configuration is present
  if (!request.pipelines_configuration?.pipelines?.default) {
    return { pipelines_configuration: request.pipelines_configuration };
  }

  // Add a new step to the start of the default pipeline
  request.pipelines_configuration.pipelines.default = [
    {
      step: {
        name: "Dynamic Step",
        script: ["echo 'This step was added dynamically'"],
      },
    },
    ...request.pipelines_configuration.pipelines.default,
  ];

  return request;
};

export const main = (request, context) => {
  // Apply the dynamic step logic to the pipeline configuration
  const updatedRequest = addDynamicStep(request);

  // Log the updated configuration for debugging
  console.log(`Updated Request: ${JSON.stringify(updatedRequest, null, 4)}`);

  // Return the modified pipeline configuration to Bitbucket Pipelines
  return { pipelines_configuration: updatedRequest.pipelines_configuration };
};
