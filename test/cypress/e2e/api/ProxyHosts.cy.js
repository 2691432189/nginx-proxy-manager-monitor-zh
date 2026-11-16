/// <reference types="cypress" />

describe('Proxy Hosts endpoints', () => {
	let token;

	before(() => {
		cy.resetUsers();
		cy.getToken().then((tok) => {
			token = tok;
		});
	});

	it('Should be able to create a http host', () => {
		cy.task('backendApiPost', {
			token: token,
			path:  '/api/nginx/proxy-hosts',
			data:  {
				domain_names:   ['test.example.com'],
				forward_scheme: 'http',
				forward_host:   '1.1.1.1',
				forward_port:   80,
				access_list_id: '0',
				certificate_id: 0,
				meta:           {
					dns_challenge: false
				},
				advanced_config:         '',
				locations:               [],
				block_exploits:          false,
				caching_enabled:         false,
				allow_websocket_upgrade: false,
				http2_support:           false,
				hsts_enabled:            false,
				hsts_subdomains:         false,
				ssl_forced:              false
			}
		}).then((data) => {
			cy.validateSwaggerSchema('post', 201, '/nginx/proxy-hosts', data);
			expect(data).to.have.property('id');
			expect(data.id).to.be.greaterThan(0);
			expect(data).to.have.property('enabled');
			expect(data).to.have.property("enabled", true);
			expect(data).to.have.property('meta');
			expect(typeof data.meta.nginx_online).to.be.equal('undefined');
		});
	});

	it('Should default listen ports for old clients', () => {
		cy.task('backendApiPost', {
			token: token,
			path:  '/api/nginx/proxy-hosts',
			data:  {
				domain_names:   ['default-port.example.com'],
				forward_scheme: 'http',
				forward_host:   '1.1.1.1',
				forward_port:   80,
				access_list_id: '0',
				certificate_id: 0,
				meta:           {
					dns_challenge: false
				},
				advanced_config:         '',
				locations:               [],
				block_exploits:          false,
				caching_enabled:         false,
				allow_websocket_upgrade: false,
				http2_support:           false,
				hsts_enabled:            false,
				hsts_subdomains:         false,
				ssl_forced:              false
			}
		}).then((data) => {
			cy.validateSwaggerSchema('post', 201, '/nginx/proxy-hosts', data);
			expect(data.listen_port).to.equal(80);
			expect(data.listen_port_ssl).to.equal(443);
		});
	});

	it('Should accept custom listen ports', () => {
		cy.task('backendApiPost', {
			token: token,
			path:  '/api/nginx/proxy-hosts',
			data:  {
				domain_names:    ['custom-port.example.com'],
				forward_scheme:  'http',
				forward_host:    '1.1.1.1',
				forward_port:    8081,
				listen_port:     8080,
				listen_port_ssl: 8443,
				access_list_id:  '0',
				certificate_id:  0,
				meta:            {
					dns_challenge: false
				},
				advanced_config:         '',
				locations:               [],
				block_exploits:          false,
				caching_enabled:         false,
				allow_websocket_upgrade: false,
				http2_support:           false,
				hsts_enabled:            false,
				hsts_subdomains:         false,
				ssl_forced:              false
			}
		}).then((data) => {
			expect(data.listen_port).to.equal(8080);
			expect(data.listen_port_ssl).to.equal(8443);
		});
	});

	it('Should reject reserved listen ports', () => {
		cy.task('backendApiPost', {
			token:         token,
			path:          '/api/nginx/proxy-hosts',
			returnOnError: true,
			data:          {
				domain_names:   ['reserved-port.example.com'],
				forward_scheme: 'http',
				forward_host:   '1.1.1.1',
				forward_port:   80,
				listen_port:    3000,
				access_list_id: '0',
				certificate_id: 0,
				meta:           {
					dns_challenge: false
				},
				advanced_config:         '',
				locations:               [],
				block_exploits:          false,
				caching_enabled:         false,
				allow_websocket_upgrade: false,
				http2_support:           false,
				hsts_enabled:            false,
				hsts_subdomains:         false,
				ssl_forced:              false
			}
		}).then((res) => {
			expect(res).to.have.property('error');
			expect(res.error.code).to.equal(400);
		});
	});

	it('Should update listen ports', () => {
		cy.task('backendApiPost', {
			token: token,
			path:  '/api/nginx/proxy-hosts',
			data:  {
				domain_names:   ['update-port.example.com'],
				forward_scheme: 'http',
				forward_host:   '1.1.1.1',
				forward_port:   8081,
				listen_port:     8080,
				listen_port_ssl: 8443,
				access_list_id: '0',
				certificate_id: 0,
				meta:           {
					dns_challenge: false
				},
				advanced_config:         '',
				locations:               [],
				block_exploits:          false,
				caching_enabled:         false,
				allow_websocket_upgrade: false,
				http2_support:           false,
				hsts_enabled:            false,
				hsts_subdomains:         false,
				ssl_forced:              false
			}
		}).then((host) => {
			return cy.task('backendApiPut', {
				token: token,
				path:  `/api/nginx/proxy-hosts/${host.id}`,
				data:  {
					listen_port:     8081,
					listen_port_ssl: 8444
				}
			});
		}).then((data) => {
			expect(data.listen_port).to.equal(8081);
			expect(data.listen_port_ssl).to.equal(8444);
		});
	});

});
