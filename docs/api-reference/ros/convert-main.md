# ConvertMain

Utility class that implements the conversion flow for XVIZ.

Register any Providers with the [XVIZProviderFactory](/docs/api-reference/io/xviz-provider-factory.md)
before calling the `execute()` method.

## Methods

##### async execute(args, providerFactory)

Execute

Parameters:

- `args`
  - `bagPath` (String) - Source path for the data
  - `dir` (String) - Directory where the files will be output
  - `start` (String) - starting time
  - `end` (String) - ending time
  - `rosConfig` (string) - file path to ROSConfig
