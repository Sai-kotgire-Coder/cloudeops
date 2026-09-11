// Real, syntactically valid Ansible playbook task YAML per module -- what
// you'd actually find in that module's docs, not the simplified params the
// interactive playbook editor uses.
export const ANSIBLE_SNIPPETS: Record<string, string> = {
  apt: `- name: Install nginx
  ansible.builtin.apt:
    name: nginx
    state: present
    update_cache: true`,

  yum: `- name: Install httpd
  ansible.builtin.yum:
    name: httpd
    state: present`,

  systemd: `- name: Ensure nginx is running and enabled
  ansible.builtin.systemd:
    name: nginx
    state: started
    enabled: true`,

  copy: `- name: Copy application config
  ansible.builtin.copy:
    src: files/app.conf
    dest: /etc/app/app.conf
    owner: root
    mode: '0644'`,

  template: `- name: Render nginx config from template
  ansible.builtin.template:
    src: templates/nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: Reload nginx`,

  file: `- name: Ensure web root exists with correct permissions
  ansible.builtin.file:
    path: /var/www/html
    state: directory
    owner: www-data
    mode: '0755'`,

  lineinfile: `- name: Add local DNS entry
  ansible.builtin.lineinfile:
    path: /etc/hosts
    line: "127.0.0.1 app.local"
    state: present`,

  user: `- name: Create deploy user
  ansible.builtin.user:
    name: deploy
    shell: /bin/bash
    groups: sudo
    append: true`,

  group: `- name: Create developers group
  ansible.builtin.group:
    name: developers
    gid: 1500
    state: present`,

  git: `- name: Clone application repository
  ansible.builtin.git:
    repo: https://github.com/example/app.git
    dest: /opt/app
    version: main`,

  cron: `- name: Schedule nightly backup
  ansible.builtin.cron:
    name: "backup job"
    minute: "0"
    hour: "2"
    job: "/usr/local/bin/backup.sh"`,

  command: `- name: Run database migration
  ansible.builtin.command:
    cmd: php artisan migrate --force
  register: migrate_result
  changed_when: "'Nothing to migrate' not in migrate_result.stdout"`,

  shell: `- name: Check application health
  ansible.builtin.shell:
    cmd: curl -s http://localhost/health | grep ok
  register: health_check
  changed_when: false`,

  docker_container: `- name: Run web container
  community.docker.docker_container:
    name: web
    image: "nginx:latest"
    state: started
    ports:
      - "80:80"`,

  pip: `- name: Install Django
  ansible.builtin.pip:
    name: django
    version: "5.0"`,

  unarchive: `- name: Extract application release
  ansible.builtin.unarchive:
    src: app-release.tar.gz
    dest: /opt/app
    remote_src: true`,

  uri: `- name: Check API health endpoint
  ansible.builtin.uri:
    url: https://api.example.com/health
    method: GET
    status_code: 200`,

  firewalld: `- name: Allow HTTPS traffic
  ansible.posix.firewalld:
    port: 443/tcp
    permanent: true
    state: enabled
    immediate: true`,

  wait_for: `- name: Wait for application to start listening
  ansible.builtin.wait_for:
    port: 8080
    timeout: 30`,

  debug: `- name: Show deployment result
  ansible.builtin.debug:
    msg: "Deployment complete"`,
};

export function getAnsibleSnippet(moduleId: string): string {
  return ANSIBLE_SNIPPETS[moduleId] ?? '';
}
