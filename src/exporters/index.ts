'use strict';

export import Base = require('./base');
export import Filesystem = require('./filesystem');
export import HTTP = require('./http');

interface IExporterLibrary {
    base: typeof Base.Exporter;
    filesystem: typeof Filesystem.FilesystemExporter;
    http: typeof HTTP.HTTPExporter;
}

export const Exporters: IExporterLibrary = {
    base: Base.Exporter,
    filesystem: Filesystem.FilesystemExporter,
    http: HTTP.HTTPExporter,
};
